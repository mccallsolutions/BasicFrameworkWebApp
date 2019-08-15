import { CognitoAuth } from "amazon-cognito-auth-js/dist/amazon-cognito-auth";
import { CognitoUserPool } from "amazon-cognito-identity-js";
import { config as AWSConfig, CognitoIdentityCredentials } from "aws-sdk";
import appConfig from "../config/app-config.json";

AWSConfig.region = appConfig.region;

// Creates a CognitoAuth instance
const createCognitoAuth = () => {
  const appWebDomain = appConfig.userPoolBaseUri
    .replace("https://", "")
    .replace("http://", "");
  const auth = new CognitoAuth({
    UserPoolId: appConfig.userPool,
    ClientId: appConfig.clientId,
    AppWebDomain: appWebDomain,
    TokenScopesArray: appConfig.tokenScopes,
    RedirectUriSignIn: appConfig.callbackUri,
    RedirectUriSignOut: appConfig.signoutUri
  });
  return auth;
};

// Creates a CognitoUser instance
const createCognitoUser = () => {
  const pool = createCognitoUserPool();
  return pool.getCurrentUser();
};

// Creates a CognitoUserPool instance
const createCognitoUserPool = () =>
  new CognitoUserPool({
    UserPoolId: appConfig.userPool,
    ClientId: appConfig.clientId
  });

// Get the URI of the hosted sign in screen
const getCognitoSignInUri = () => {
  const signinUri = `${
    appConfig.userPoolBaseUri
  }/login?response_type=code&client_id=${appConfig.clientId}&redirect_uri=${
    appConfig.callbackUri
  }`;
  return signinUri;
};

// Parse the response from a Cognito callback URI (assumed a token or code is in the supplied href). Returns a promise.
const parseCognitoWebResponse = href => {
  return new Promise((resolve, reject) => {
    console.info(href);
    const auth = createCognitoAuth();
    console.info(auth);

    // userHandler will trigger the promise
    auth.userhandler = {
      onSuccess: function(result) {
        resolve(result);
      },
      onFailure: function(err) {
        console.error(err);
        reject(new Error("Failure parsing Cognito web response: " + err));
      }
    };

    console.info(href);
    auth.parseCognitoWebResponse(href);
  });
};

// Gets a new Cognito session. Returns a promise.
const getCognitoSession = () => {
  return new Promise((resolve, reject) => {
    const cognitoUser = createCognitoUser();
    cognitoUser.getSession((err, result) => {
      if (err || !result) {
        console.error(err);
        reject(new Error("Failure getting Cognito session: " + err));
        return;
      }

      console.debug("Successfully got session: " + JSON.stringify(result));
      const poolUrl = `${appConfig.userPoolBaseUri}/${appConfig.userPool}`;
      const credentials = new CognitoIdentityCredentials({
        Logins: {
          [poolUrl]: result.idToken.jwtToken
        }
      });

      // Resolve the promise with the session credentials
      const session = {
        credentials,
        user: {
          userName: result.idToken.payload["cognito:username"],
          email: result.idToken.payload.email
        }
      };
      resolve(session);
    });
  });
};

// Sign out of the current session (will redirect to signout URI)
const signOutCognitoSession = () => {
  const auth = createCognitoAuth();
  auth.signOut();
};

export default {
  createCognitoAuth,
  createCognitoUser,
  createCognitoUserPool,
  getCognitoSession,
  getCognitoSignInUri,
  parseCognitoWebResponse,
  signOutCognitoSession
};