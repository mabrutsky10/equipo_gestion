const awsmobiledev = {
  Auth: {
    Cognito: {
      userPoolId: "us-east-2_1WuxwXceK",
      userPoolClientId: "1i75b80rooe7hgobm623n41g50",
      signUpVerificationMethod: "code" as const,
      loginWith: {
        oauth: {
          domain: "auth-dev.mas10.ar",
          scopes: ["email", "openid", "profile", "aws.cognito.signin.user.admin"],
          redirectSignIn: ["http://localhost:5180/auth/register"],
          redirectSignOut: ["http://localhost:5180/auth/login"],
          responseType: "code" as const,
        },
      },
    },
  },
};
export default awsmobiledev;

