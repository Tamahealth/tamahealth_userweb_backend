const GoogleStrategy = require("passport-google-oauth20").Strategy;
const passport = require('passport');

passport.serializeUser((user, done) => {
    // Your serialization logic here
    done(null, user.id);
});

passport.use(

    new GoogleStrategy(
        {clientID: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            callbackURL: "/auth/google/callback",
            scope: ["profile", "email"],
        },
        function (accessToken, refreshToken, profile, callback){
            callback(null, profile);
        }
    )
);

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    // Your deserialization logic here
    // For example, retrieve the user from the database based on the id.
    // Then, call done with the user object as the second argument.
    // If the user is not found, call done with an error as the first argument.
});
