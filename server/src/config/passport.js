const passport = require("passport");
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");
const User = require("../app/models/User");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      proxy: true,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        // 1. מצא לפי googleId
        let user = await User.findOne({ googleId: profile.id });
        if (user) return done(null, user);

        // 2. מצא לפי אימייל (חשבון קיים) — חבר את ה-googleId
        const email = profile.emails?.[0]?.value?.toLowerCase();
        if (email) {
          user = await User.findOne({ email });
          if (user) {
            user.googleId = profile.id;
            await user.save();
            return done(null, user);
          }
        }

        // 3. צור משתמש חדש
        user = await User.create({
          googleId: profile.id,
          name: profile.displayName || "משתמש Google",
          email: email || `google_${profile.id}@noemail.local`,
          passwordHash: null,
        });
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    },
  ),
);

module.exports = passport;
