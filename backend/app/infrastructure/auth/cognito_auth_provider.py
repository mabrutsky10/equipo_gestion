from typing import Optional
from jose import jwt, jwk
from jose.utils import base64url_decode
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import serialization
import httpx
import logging
from app.application.interfaces.auth_provider import AuthProvider
from app.domain.entities.user import User
from app.application.interfaces.repositories import UserRepository
from app.infrastructure.config import settings

logger = logging.getLogger(__name__)

# Cognito configuration
COGNITO_REGION = "us-east-2"
COGNITO_USER_POOL_ID = "us-east-2_1WuxwXceK"
COGNITO_ISSUER = f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{COGNITO_USER_POOL_ID}"
DEFAULT_TEAM_ID = 32582

# Cache for JWKS
_jwks_cache = None
_jwks_cache_expiry = None


class CognitoAuthProvider(AuthProvider):
    """Authentication provider using AWS Cognito JWT tokens."""
    
    def __init__(self, user_repository: UserRepository):
        self.user_repository = user_repository
    
    async def _get_jwks(self) -> dict:
        """Get JSON Web Key Set from Cognito."""
        global _jwks_cache, _jwks_cache_expiry
        import time
        
        # Return cached JWKS if still valid (cache for 1 hour)
        if _jwks_cache and _jwks_cache_expiry and time.time() < _jwks_cache_expiry:
            return _jwks_cache
        
        try:
            jwks_url = f"{COGNITO_ISSUER}/.well-known/jwks.json"
            async with httpx.AsyncClient() as client:
                response = await client.get(jwks_url, timeout=10.0)
                response.raise_for_status()
                jwks_data = response.json()
                
                # Cache for 1 hour
                _jwks_cache = jwks_data
                _jwks_cache_expiry = time.time() + 3600
                
                return jwks_data
        except Exception as e:
            logger.error(f"Error fetching JWKS from Cognito: {e}")
            raise
    
    def _get_signing_key(self, token: str, jwks: dict) -> Optional[dict]:
        """Get the signing key for the token from JWKS."""
        try:
            # Decode token header without verification
            unverified_header = jwt.get_unverified_header(token)
            kid = unverified_header.get("kid")
            
            if not kid:
                logger.warning("Token missing 'kid' in header")
                return None
            
            # Find the key with matching kid
            for key in jwks.get("keys", []):
                if key.get("kid") == kid:
                    return key
            
            logger.warning(f"No matching key found for kid: {kid}")
            return None
        except Exception as e:
            logger.error(f"Error getting signing key: {e}")
            return None
    
    async def get_current_user(self, token: str) -> Optional[User]:
        """Get current user from Cognito JWT token."""
        try:
            # Get JWKS
            jwks = await self._get_jwks()
            
            # Get signing key
            signing_key = self._get_signing_key(token, jwks)
            if not signing_key:
                logger.warning("Could not get signing key for token")
                return None
            
            # Verify and decode token
            try:
                # Convert JWK to RSA public key
                public_key_jwk = jwk.construct(signing_key)
                
                # Get the public key in PEM format
                # python-jose's jwk.construct returns a key object that can be used directly
                # but we need to convert it properly for jwt.decode
                if hasattr(public_key_jwk, 'to_pem'):
                    public_key_pem = public_key_jwk.to_pem().decode('utf-8')
                else:
                    # Fallback: construct RSA key from JWK components
                    n = base64url_decode(signing_key['n'].encode('utf-8'))
                    e = base64url_decode(signing_key['e'].encode('utf-8'))
                    
                    # Convert to integers
                    n_int = int.from_bytes(n, 'big')
                    e_int = int.from_bytes(e, 'big')
                    
                    # Create RSA public key
                    public_numbers = rsa.RSAPublicNumbers(e_int, n_int)
                    public_key = public_numbers.public_key(default_backend())
                    
                    # Serialize to PEM
                    public_key_pem = public_key.public_bytes(
                        encoding=serialization.Encoding.PEM,
                        format=serialization.PublicFormat.SubjectPublicKeyInfo
                    ).decode('utf-8')
                
                # Decode and verify token
                payload = jwt.decode(
                    token,
                    public_key_pem,
                    algorithms=["RS256"],
                    audience=None,  # Cognito tokens don't always have audience
                    issuer=COGNITO_ISSUER,
                    options={"verify_aud": False, "verify_signature": True},
                )
            except jwt.ExpiredSignatureError:
                logger.warning("Token has expired")
                return None
            except jwt.JWTError as e:
                logger.warning(f"JWT validation error: {e}")
                return None
            
            # Extract email from token
            # Cognito tokens can have email in different claims
            email = (
                payload.get("email") or
                payload.get("cognito:username") or
                payload.get("sub")  # Fallback to sub (username)
            )
            
            if not email:
                logger.warning("Token payload missing email/username")
                return None
            
            # Normalize email (Cognito might return email in different case)
            email = email.lower().strip()
            
            # Find or create user in our database
            user = await self.user_repository.get_by_email(email)
            
            if not user:
                logger.warning(f"User {email} not found in database. Using fallback identity with team_id {DEFAULT_TEAM_ID}")
                user = User(
                    id=None,
                    email=email,
                    userprofile_id=None,
                    hashed_password=None,
                    is_active=True,
                    team_id=DEFAULT_TEAM_ID,
                )
                return user
            elif not user.is_active:
                logger.warning(f"User {email} is not active")
                return None
            elif not user.team_id:
                logger.info(f"Assigning default team_id={DEFAULT_TEAM_ID} to user {email}")
                updated_user = await self.user_repository.update_team_id(user.id, DEFAULT_TEAM_ID)
                if updated_user:
                    user = updated_user
            
            return user
            
        except Exception as e:
            logger.error(f"Error validating Cognito token: {e}", exc_info=True)
            return None
    
    async def authenticate_user(self, email: str, password: str) -> Optional[str]:
        """Not used for Cognito - authentication happens via OAuth."""
        raise NotImplementedError("Cognito authentication uses OAuth, not email/password")
    
    async def register_user(
        self, email: str, password: str, userprofile_id: Optional[int] = None
    ) -> Optional[User]:
        """Not used for Cognito - registration happens via OAuth."""
        raise NotImplementedError("Cognito registration uses OAuth, not direct registration")
    
    async def refresh_token(self, token: str) -> Optional[str]:
        """Not used for Cognito - token refresh is handled by AWS Amplify."""
        raise NotImplementedError("Cognito token refresh is handled client-side")

