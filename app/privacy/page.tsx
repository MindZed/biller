import Link from "next/link"

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 p-8 pt-20">
      <div className="max-w-3xl mx-auto flex flex-col gap-8 bg-zinc-900/50 p-8 rounded-[2rem] border border-white/5">
        <h1 className="text-4xl font-black text-white">Privacy Policy</h1>
        
        <p className="text-sm text-zinc-500 font-medium">Last updated: August 2026</p>

        <section className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-white">1. Introduction</h2>
          <p>
            Welcome to Mindzed Biller ("we", "our", or "us"). We are committed to protecting your personal information and your right to privacy.
            This Privacy Policy explains how we collect, use, and share your information when you use our application at biller.mindzed.tech.
          </p>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-white">2. Data We Collect</h2>
          <p>
            When you use our application, we collect the following information:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Google Account Information:</strong> Your email address, name, and profile picture provided via Google OAuth.</li>
            <li><strong>Google Sheets Data:</strong> We request permission to view, edit, and create Google Sheets on your behalf to function as a ledger for your expenses.</li>
            <li><strong>Expense Data:</strong> The amounts, categories, and notes you input into the app, which are stored locally on your device and synced to your own Google Sheet.</li>
          </ul>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-white">3. How We Use Your Data</h2>
          <p>
            We use the information we collect strictly to provide the core functionality of the application:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>To authenticate you securely using your Google Account.</li>
            <li>To automatically create a Google Sheet in your Google Drive to act as your expense ledger.</li>
            <li>To append your new expenses to your Google Sheet.</li>
            <li>To facilitate expense sharing and syncing between you and your linked friends within the app.</li>
          </ul>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-white">4. Google Workspace APIs and Limited Use</h2>
          <p>
            Mindzed Biller's use and transfer to any other app of information received from Google APIs will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer" className="text-rose-500 hover:underline">Google API Services User Data Policy</a>, including the Limited Use requirements. 
          </p>
          <p>
            We do not sell, trade, or otherwise transfer your Google user data to outside parties. Your expense data is stored directly in your own Google Drive.
          </p>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-white">5. Contact Us</h2>
          <p>
            If you have questions or comments about this Privacy Policy, you may contact us at: <br/>
            <strong>hello@mindzed.tech</strong>
          </p>
        </section>

        <div className="mt-8 pt-8 border-t border-white/10 flex justify-center">
          <Link href="/" className="text-rose-500 font-bold hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
