export const keepAliveConfig = {
  // Add multiple projects here
  projects: [
    {
      name: "Main Project",
      url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role key for admin access
    },
    // {
    //   name: "Other Project",
    //   url: process.env.OTHER_SUPABASE_URL!,
    //   serviceRoleKey: process.env.OTHER_SUPABASE_SERVICE_ROLE_KEY!,
    // },
  ],
  // Cron Secret to prevent unauthorized access to the API
  cronSecret: process.env.CRON_SECRET,
};
