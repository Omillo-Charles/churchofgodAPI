import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import prisma from '../database/postgresql.js';
import {
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET,
    WEB_URL
} from './env.js';

const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:5500/api/v1';

// Google Strategy
passport.use(
    new GoogleStrategy(
        {
            clientID: GOOGLE_CLIENT_ID,
            clientSecret: GOOGLE_CLIENT_SECRET,
            callbackURL: `${apiBaseUrl}/auth/google/callback`,
            scope: ['profile', 'email'],
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails[0].value;
                const googleId = profile.id;

                // 1. Check if user with googleId exists
                let user = await prisma.user.findUnique({ where: { googleId } });

                if (!user) {
                    // 2. Check if user with email exists
                    user = await prisma.user.findUnique({ where: { email } });

                    if (user) {
                        // Link googleId to existing account
                        user = await prisma.user.update({
                            where: { email },
                            data: { googleId },
                        });
                    } else {
                        // 3. Create new user
                        user = await prisma.user.create({
                            data: {
                                fullName: profile.displayName,
                                email,
                                googleId,
                            },
                        });
                    }
                }

                return done(null, user);
            } catch (error) {
                return done(error, null);
            }
        }
    )
);

// GitHub Strategy
passport.use(
    new GitHubStrategy(
        {
            clientID: GITHUB_CLIENT_ID,
            clientSecret: GITHUB_CLIENT_SECRET,
            callbackURL: `${apiBaseUrl}/auth/github/callback`,
            scope: ['user:email'],
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails && profile.emails.length > 0 
                    ? profile.emails[0].value 
                    : `${profile.username}@github.com`; // Fallback if email is private
                const githubId = profile.id.toString();

                let user = await prisma.user.findUnique({ where: { githubId } });

                if (!user) {
                    user = await prisma.user.findUnique({ where: { email } });

                    if (user) {
                        user = await prisma.user.update({
                            where: { email },
                            data: { githubId },
                        });
                    } else {
                        user = await prisma.user.create({
                            data: {
                                fullName: profile.displayName || profile.username,
                                email,
                                githubId,
                            },
                        });
                    }
                }

                return done(null, user);
            } catch (error) {
                return done(error, null);
            }
        }
    )
);

export default passport;
