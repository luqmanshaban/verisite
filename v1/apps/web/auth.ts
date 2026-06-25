import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/user";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, profile }) {
      await connectDB();
      await User.findOneAndUpdate(
        { email: user.email },
        {
          email: user.email,
          name: user.name,
          avatar: user.image,
          githubId: (profile as { id: string })?.id,
        },
        { upsert: true, new: true }
      );
      return true;
    },
    async session({ session }) {
      await connectDB();
      const dbUser = await User.findOne({ email: session.user.email });
      if (dbUser) {
        session.user.id = dbUser._id.toString();
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});