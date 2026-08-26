import Link from "next/link"

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 p-8 pt-20">
      <div className="max-w-3xl mx-auto flex flex-col gap-8 bg-zinc-900/50 p-8 rounded-[2rem] border border-white/5">
        <h1 className="text-4xl font-black text-white">Terms of Service</h1>
        
        <p className="text-sm text-zinc-500 font-medium">Last updated: August 2026</p>

        <section className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-white">1. Agreement to Terms</h2>
          <p>
            By accessing or using Mindzed Biller (the "Service") at biller.mindzed.tech, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the Service.
          </p>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-white">2. Description of Service</h2>
          <p>
            Mindzed Biller is an expense tracking application that allows users to record, categorize, and split expenses. The Service integrates with Google Workspace APIs (specifically Google Sheets) to store your expense data directly in your own Google Drive.
          </p>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-white">3. User Accounts and Data</h2>
          <p>
            To use the Service, you must authenticate using your Google Account. You are responsible for maintaining the confidentiality of your account credentials. You retain all rights to the data you input into the Service, which is stored in your personal Google Drive.
          </p>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-white">4. Acceptable Use</h2>
          <p>
            You agree not to use the Service:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>For any unlawful purpose or to solicit others to perform any unlawful acts.</li>
            <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others.</li>
            <li>To submit false or misleading information.</li>
          </ul>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-white">5. Disclaimer of Warranties</h2>
          <p>
            The Service is provided on an "AS IS" and "AS AVAILABLE" basis. We make no warranties, expressed or implied, regarding the reliability, accuracy, or availability of the Service or the underlying Google Workspace infrastructure.
          </p>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-white">6. Changes to Terms</h2>
          <p>
            We reserve the right to modify or replace these Terms at any time. We will try to provide at least 30 days' notice prior to any new terms taking effect.
          </p>
        </section>
        
        <section className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-white">7. Contact Us</h2>
          <p>
            If you have questions or comments about these Terms, you may contact us at: <br/>
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
