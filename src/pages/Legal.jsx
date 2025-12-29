import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Shield, Lock, FileText, AlertCircle } from 'lucide-react';

const LegalLayout = ({ title, icon: Icon, children }) => (
  <div className="min-h-screen bg-black text-white font-sans">
    <Navbar />
    <div className="pt-32 pb-20 px-4 max-w-4xl mx-auto">
        <div className="border-b border-white/10 pb-8 mb-10">
            <h1 className="text-3xl md:text-5xl font-gaming text-white flex items-center gap-4">
                <Icon size={40} className="text-brand-green"/> {title}
            </h1>
        </div>
        <div className="prose prose-invert max-w-none text-gray-300">
            {children}
        </div>
    </div>
    <Footer />
  </div>
);

export const Privacy = () => (
  <LegalLayout title="PRIVACY POLICY" icon={Lock}>
    <div className="space-y-8">
        <section>
            <h3 className="text-xl font-bold text-white mb-3">1. Information We Collect</h3>
            <p>We only collect minimal information required to organize tournaments effectively:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2 text-gray-400">
                <li>Email Address (for Login and Notifications)</li>
                <li>In-Game Name & UID (for Slot Verification)</li>
                <li>WhatsApp Number (for Room ID/Pass communication)</li>
                <li>Payment Screenshots (for verification of paid matches)</li>
            </ul>
        </section>

        <section>
            <h3 className="text-xl font-bold text-white mb-3">2. Data Security</h3>
            <p>Your data is stored securely on Google Firebase servers. We do not sell or share your personal contact details with any third-party advertisers.</p>
        </section>

        <section>
            <h3 className="text-xl font-bold text-white mb-3">3. Payments</h3>
            <p>All payments made for tournament entry fees are final. Refunds are processed only if a match is cancelled by 9T9 Esports.</p>
        </section>
    </div>
  </LegalLayout>
);

export const Terms = () => (
  <LegalLayout title="TERMS & CONDITIONS" icon={FileText}>
    <div className="space-y-8">
        <section>
            <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2"><AlertCircle size={20} className="text-red-500"/> 1. Fair Play Policy</h3>
            <p>9T9 Esports has a zero-tolerance policy towards hacking, scripting, or teaming.</p>
            <ul className="list-disc pl-5 space-y-2 mt-2 text-gray-400">
                <li>Any player found using hacks will be permanently banned.</li>
                <li>Teaming up with other squads in Solo/Duo matches is strictly prohibited.</li>
                <li>Emulators are not allowed unless specified in the match rules.</li>
            </ul>
        </section>

        <section>
            <h3 className="text-xl font-bold text-white mb-3">2. Screenshot Rules</h3>
            <p>Winners must upload the winning screenshot (Booyah screen) within 30 minutes of the match ending to claim the prize. Failure to do so may result in prize forfeiture.</p>
        </section>

        <section>
            <h3 className="text-xl font-bold text-white mb-3">3. Admin Rights</h3>
            <p>The decision of 9T9 Esports Admins regarding points, bans, and scheduling is final and binding. We reserve the right to cancel any match due to technical issues.</p>
        </section>
    </div>
  </LegalLayout>
);