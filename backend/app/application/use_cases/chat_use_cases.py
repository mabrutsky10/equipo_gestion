from typing import List, Optional, Tuple
from datetime import datetime
import httpx
import logging
import hashlib
from app.application.interfaces.repositories import ChatRepository
from app.domain.entities.chat_message import ChatMessage
from app.domain.entities.assistant import Assistant

logger = logging.getLogger(__name__)

# N8N Webhook URLs
N8N_GUILLOTE_WEBHOOK_URL = "https://data10.app.n8n.cloud/webhook/5186feaf-5801-4576-8ebc-044bef043a28/chat"
N8N_PELA_WEBHOOK_URL = "https://data10.app.n8n.cloud/webhook/e3538923-0cb3-4abc-8c83-9bfef2f7eb82/chat"
N8N_CHORI_WEBHOOK_URL = "https://data10.app.n8n.cloud/webhook/6c4e8569-0c19-4132-8cc5-328cd83a3cd2/chat"


class GetAssistantsUseCase:
    def __init__(self, chat_repository: ChatRepository):
        self.chat_repository = chat_repository
    
    async def execute(self) -> List[Assistant]:
        return await self.chat_repository.get_assistants()


class GetMessagesUseCase:
    def __init__(self, chat_repository: ChatRepository):
        self.chat_repository = chat_repository
    
    async def execute(
        self, team_id: int, assistant_id: str, limit: Optional[int] = None
    ) -> List[ChatMessage]:
        messages = await self.chat_repository.get_by_team_and_assistant(
            team_id, assistant_id, limit
        )
        # Return in chronological order (oldest first)
        return list(reversed(messages))


class SendMessageUseCase:
    def __init__(self, chat_repository: ChatRepository):
        self.chat_repository = chat_repository
    
    async def execute(
        self, team_id: int, user_id: int, assistant_id: str, content: str, userprofile_id: Optional[int] = None
    ) -> Tuple[ChatMessage, ChatMessage]:
        """
        Send a message from user to assistant and get assistant's reply.
        Returns tuple of (user_message, assistant_message).
        """
        try:
            # Create user message
            user_message = ChatMessage(
                id=None,
                team_id=team_id,
                user_id=user_id,
                assistant_id=assistant_id,
                content=content,
                sender='user',
                timestamp=datetime.utcnow(),
            )
            saved_user_message = await self.chat_repository.create(user_message)
            
            # Generate assistant reply
            # For Guillote, Pela, and Chori, use N8N webhook; for others, use mock
            try:
                if assistant_id == 'guillote':
                    assistant_reply = await self._generate_guillote_reply(content, team_id, userprofile_id or user_id)
                elif assistant_id == 'pela':
                    assistant_reply = await self._generate_pela_reply(content, team_id, userprofile_id or user_id)
                elif assistant_id == 'chori':
                    assistant_reply = await self._generate_chori_reply(content, team_id, userprofile_id or user_id)
                else:
                    assistant_reply = self._generate_assistant_reply(assistant_id, content)
            except Exception as reply_error:
                logger.error(f"Error generating assistant reply: {reply_error}", exc_info=True)
                # Fallback reply if generation fails
                assistant_reply = "Lo siento, hubo un problema al procesar tu mensaje. Por favor, inténtalo de nuevo."
            
            assistant_message = ChatMessage(
                id=None,
                team_id=team_id,
                user_id=user_id,
                assistant_id=assistant_id,
                content=assistant_reply,
                sender='assistant',
                timestamp=datetime.utcnow(),
            )
            saved_assistant_message = await self.chat_repository.create(assistant_message)
            
            return saved_user_message, saved_assistant_message
        except Exception as e:
            logger.error(f"Error in SendMessageUseCase.execute: {e}", exc_info=True)
            # Re-raise to be handled by the endpoint
            raise
    
    def _generate_session_id(self, team_id: int, user_identifier: int, assistant_id: str) -> str:
        """
        Generate a consistent session ID based on team_id, user_identifier (userprofile_id for Guillote), and assistant_id.
        This ensures the same user/team/assistant combination always gets the same session.
        """
        # Create a hash from team_id, user_identifier, and assistant_id for consistency
        session_string = f"{team_id}_{user_identifier}_{assistant_id}"
        session_hash = hashlib.md5(session_string.encode()).hexdigest()
        return session_hash
    
    async def _generate_guillote_reply(self, user_message: str, team_id: int, userprofile_id: int) -> str:
        """
        Generate reply from Guillote using N8N webhook.
        Same format as other assistants: { "sessionId": "...", "action": "sendMessage", "chatInput": "...", "userID": ..., "teamID": ... }
        """
        return await self._generate_n8n_reply(
            user_message, team_id, userprofile_id, 'guillote', N8N_GUILLOTE_WEBHOOK_URL
        )
    
    async def _generate_pela_reply(self, user_message: str, team_id: int, userprofile_id: int) -> str:
        """
        Generate reply from Pela using N8N webhook.
        Same format as Guillote: { "sessionId": "...", "action": "sendMessage", "chatInput": "...", "userID": ..., "teamID": ... }
        """
        return await self._generate_n8n_reply(
            user_message, team_id, userprofile_id, 'pela', N8N_PELA_WEBHOOK_URL
        )
    
    async def _generate_chori_reply(self, user_message: str, team_id: int, userprofile_id: int) -> str:
        """
        Generate reply from Chori using N8N webhook.
        Same format as Guillote: { "sessionId": "...", "action": "sendMessage", "chatInput": "...", "userID": ..., "teamID": ... }
        """
        return await self._generate_n8n_reply(
            user_message, team_id, userprofile_id, 'chori', N8N_CHORI_WEBHOOK_URL
        )
    
    async def _generate_n8n_reply(self, user_message: str, team_id: int, userprofile_id: int, assistant_id: str, webhook_url: str) -> str:
        """
        Generic method to generate reply from N8N webhook for any assistant.
        """
        try:
            # Generate consistent session ID (using userprofile_id for session consistency)
            session_id = self._generate_session_id(team_id, userprofile_id, assistant_id)
            
            # Prepare payload according to N8N Chat Trigger format
            # userID uses userprofile_id as requested
            payload = {
                "sessionId": session_id,
                "action": "sendMessage",
                "chatInput": user_message,
                "userID": userprofile_id,
                "teamID": team_id,
            }
            
            logger.info(f"Calling N8N webhook for {assistant_id} - sessionId: {session_id}, message: {user_message[:50]}..., team_id: {team_id}, userprofile_id: {userprofile_id}")
            logger.info(f"N8N payload: {payload}")
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    webhook_url,
                    json=payload,
                    headers={"Content-Type": "application/json"},
                )
                
                logger.info(f"N8N webhook response status: {response.status_code}")
                logger.info(f"N8N webhook response headers: {dict(response.headers)}")
                
                # Check status before parsing
                if response.status_code >= 400:
                    error_text = response.text if hasattr(response, 'text') else "Unknown error"
                    logger.error(f"N8N webhook returned error status {response.status_code}: {error_text}")
                    return "Lo siento, hubo un problema al procesar tu mensaje. Por favor, inténtalo de nuevo."
                
                # Try to parse as JSON
                try:
                    data = response.json()
                    logger.info(f"N8N webhook JSON response: {data}")
                except Exception as json_error:
                    # If not JSON, try to get text
                    logger.warning(f"Response is not JSON, trying text: {json_error}")
                    try:
                        text_response = response.text
                        logger.info(f"N8N webhook text response: {text_response[:200]}")
                        if text_response and text_response.strip():
                            return text_response.strip()
                        return "Lo siento, recibí una respuesta vacía del servicio."
                    except Exception as text_error:
                        logger.error(f"Error reading response text: {text_error}")
                        return "Lo siento, no pude leer la respuesta del servicio."
                
                # According to N8N documentation, response can be:
                # - An object with "output" or "text" field (from Agent/Chain nodes)
                # - Direct text response
                # - Response from "Respond to Chat" node
                
                if isinstance(data, dict):
                    # Try common response fields from N8N Chat Trigger
                    reply = (
                        data.get("output") or 
                        data.get("text") or 
                        data.get("message") or 
                        data.get("response") or 
                        data.get("content") or
                        data.get("reply")
                    )
                    if reply:
                        # If reply is a dict, try to extract text from it
                        if isinstance(reply, dict):
                            reply_text = reply.get("text") or reply.get("output") or reply.get("message")
                            if reply_text:
                                return str(reply_text)
                        return str(reply)
                    
                    # If no reply field found, log the structure for debugging
                    logger.warning(f"No reply field found in response. Available keys: {list(data.keys())}")
                    logger.warning(f"Full response structure: {data}")
                
                # If response is a string, use it directly
                if isinstance(data, str):
                    return data.strip() if data.strip() else "Lo siento, recibí una respuesta vacía."
                
                # If it's a list, try to get first element
                if isinstance(data, list) and len(data) > 0:
                    first_item = data[0]
                    if isinstance(first_item, dict):
                        reply = (
                            first_item.get("output") or 
                            first_item.get("text") or 
                            first_item.get("message") or 
                            first_item.get("response")
                        )
                        if reply:
                            return str(reply)
                    # If first item is a string, use it
                    if isinstance(first_item, str):
                        return first_item.strip()
                    return str(first_item)
                
                # Fallback: return the whole response as string
                logger.warning(f"Using fallback: returning entire response as string")
                return str(data)
                
        except httpx.HTTPStatusError as e:
            error_text = e.response.text if hasattr(e.response, 'text') else str(e)
            logger.error(f"N8N webhook HTTP error: {e.response.status_code} - {error_text}")
            return "Lo siento, hubo un problema al procesar tu mensaje. Por favor, inténtalo de nuevo."
        except httpx.RequestError as e:
            logger.error(f"N8N webhook request error: {e}")
            return "Lo siento, no pude conectarme con el servicio. Por favor, inténtalo más tarde."
        except Exception as e:
            logger.error(f"Unexpected error calling N8N webhook: {e}", exc_info=True)
            return "Lo siento, ocurrió un error inesperado. Por favor, inténtalo de nuevo."
    
    def _generate_assistant_reply(self, assistant_id: str, user_message: str) -> str:
        """
        Generate a mock reply from the assistant.
        TODO: Replace with actual AI/LLM integration.
        """
        # Mock response - in production, this would call an AI service
        return f"Gracias por tu mensaje. Estoy procesando tu consulta sobre: {user_message[:50]}..."

