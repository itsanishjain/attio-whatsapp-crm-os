import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/terms')({
  component: Terms,
});

function Terms() {
  return (
    <div className="mx-4 mb-40 mt-8 flex max-w-4xl flex-col antialiased md:flex-row lg:mx-auto">
      <main className="mt-6 flex min-w-0 flex-auto flex-col px-2 md:px-0">
        <h1 className="mb-6 text-3xl font-bold">Terms and Conditions</h1>
        <div className="prose prose-lg max-w-none space-y-4 text-md">
          <p>
            These Terms and Conditions (&quot;Terms&quot;) govern access to and
            use of Attio WhatsApp Sync, including associated websites,
            interfaces, APIs, integrations, customer support, hosted services,
            and related documentation (collectively, the &quot;Service&quot;).
            By accessing, configuring, connecting, testing, subscribing to, or
            otherwise using the Service, you agree to be bound by these Terms on
            your own behalf and, if applicable, on behalf of the entity,
            workspace, principal, employer, or client for which you are acting.
            If you are using the Service on behalf of an entity, you represent
            and warrant that you have authority to bind that entity to these
            Terms.
          </p>

          <h2>1. Definitions</h2>
          <p>
            For purposes of these Terms: &quot;Customer&quot; means the person
            or entity that registers for, purchases, administers, or otherwise
            uses the Service; &quot;User&quot; means an individual authorized by
            a Customer to access or use the Service; &quot;Customer Data&quot;
            means data, content, communications, records, credentials,
            configuration inputs, logs, metadata, and other material processed
            through the Service on the Customer&apos;s behalf; and
            &quot;Third-Party Platforms&quot; means external services,
            applications, APIs, products, infrastructure, payment processors, or
            communications systems not owned or controlled by us, including
            platforms designated by the Customer for integration.
          </p>

          <h2>2. Eligibility and Enterprise Authority</h2>
          <p>
            The Service is intended for business and professional use. You may
            use the Service only if you are legally capable of entering into a
            binding agreement and are not prohibited from using the Service
            under applicable law, sanctions restrictions, export controls, or
            platform rules. If you administer access for other users, you are
            responsible for ensuring that those users are aware of and comply
            with these Terms and any internal policies applicable to your
            organization.
          </p>

          <h2>3. Service Description and Third-Party Dependencies</h2>
          <p>
            The Service is designed to facilitate the connection of WhatsApp and
            Attio workflows, the synchronization of related data, and the
            administration of settings, access controls, and related operational
            functions. The Service necessarily depends on Third-Party Platforms,
            including communications services, CRM systems, hosting providers,
            and payment infrastructure. We do not control Third-Party Platforms
            and do not guarantee their ongoing availability, interoperability,
            latency, uptime, routing, deliverability, policy continuity,
            regional availability, commercial terms, or legal status.
          </p>
          <p>
            Third-Party Platform providers may suspend, terminate, rate-limit,
            block, reject, deprecate, re-authenticate, audit, revoke,
            investigate, or otherwise alter access to integrations at any time,
            with or without notice to us. You acknowledge that such actions may
            impair, delay, degrade, or interrupt the Service and that those
            effects do not necessarily constitute a breach of these Terms by us.
          </p>
          <p>
            The Service may offer more than one WhatsApp connection path,
            including an official WhatsApp Business integration path and a
            linked-device connection path. If you choose the linked-device
            connection path instead of the official WhatsApp Business path, you
            acknowledge that the linked-device path may carry a materially
            different platform-enforcement risk profile. Without limiting the
            foregoing, WhatsApp, Meta, or another Third-Party Platform may
            review, challenge, rate-limit, require re-authentication for,
            restrict, suspend, disable, or permanently ban the connected
            account, number, business asset, or linked device, with or without
            notice. You are solely responsible for deciding whether that
            connection method is appropriate for your use case and risk
            tolerance. We do not control, and are not liable for, Third-Party
            Platform enforcement, suspension, disablement, revocation, or ban
            decisions.
          </p>

          <h2>4. Customer Responsibilities</h2>
          <p>The Customer is solely responsible for:</p>
          <ul>
            <li>
              obtaining and maintaining all rights, permissions, notices,
              consents, and legal bases required to connect accounts and process
              Customer Data through the Service;
            </li>
            <li>
              ensuring that Customer Data, including communications content,
              personal data, and CRM records, may lawfully be processed,
              transferred, disclosed, synchronized, and retained as configured
              by the Customer;
            </li>
            <li>
              determining whether the Service is appropriate for the
              Customer&apos;s industry, regulated environment, retention
              obligations, security requirements, and local legal framework;
            </li>
            <li>
              evaluating which connection method to use, including whether the
              official WhatsApp Business path or any linked-device path is more
              appropriate in light of platform rules, enforcement risk, and the
              Customer&apos;s operational requirements;
            </li>
            <li>
              configuring the Service in a manner consistent with applicable
              data protection, employment, telecommunications, marketing,
              consumer protection, sanctions, and export laws;
            </li>
            <li>
              maintaining accurate administrative contacts, secure credentials,
              and lawful team access practices; and
            </li>
            <li>
              monitoring the Customer&apos;s own use of the Service, including
              automated workflows, synchronization settings, templates, message
              content, and downstream processing.
            </li>
          </ul>

          <h2>5. Restricted and Prohibited Uses</h2>
          <p>
            The following restrictions apply to Customer and User conduct in
            connection with the Service. For the avoidance of doubt, this
            section governs how you use the Service and does not limit our right
            to operate, administer, or communicate in connection with the
            Service as described elsewhere in these Terms. You may not use the
            Service to:
          </p>
          <ul>
            <li>
              violate any law, regulation, court order, administrative order,
              platform policy, or legally binding industry rule;
            </li>
            <li>
              process or transmit unlawful, defamatory, infringing, fraudulent,
              deceptive, abusive, threatening, harassing, discriminatory, or
              malicious content;
            </li>
            <li>
              send unsolicited communications, spam, or marketing messages in
              violation of consent, opt-out, or disclosure requirements;
            </li>
            <li>
              circumvent access controls, impersonate another person or entity,
              misrepresent authorization, scrape or harvest data unlawfully, or
              attempt unauthorized access to systems or accounts;
            </li>
            <li>
              benchmark, reverse engineer, decompile, or derive source materials
              from the Service except to the extent an applicable law expressly
              prohibits such restriction; or
            </li>
            <li>
              use the Service in a manner that creates a material risk to the
              security, stability, availability, or legal compliance posture of
              the Service or any third party.
            </li>
          </ul>

          <h2>6. Customer Data, Instructions, and Role Allocation</h2>
          <p>
            As between the parties, the Customer retains responsibility for the
            legality, quality, accuracy, integrity, and rights clearance of
            Customer Data. The Customer instructs us to process Customer Data as
            necessary to provide the Service, maintain the security and
            reliability of the Service, prevent abuse, comply with law, and
            otherwise act in accordance with these Terms, our Privacy Policy,
            and any separately executed data processing addendum.
          </p>
          <p>
            If and to the extent applicable law characterizes us as a processor,
            service provider, operator, or encargada with respect to specific
            Customer Data, we will process that Customer Data in accordance with
            lawful instructions reflected in the governing agreement, except
            where required to do otherwise by law or where necessary to protect
            the Service, our rights, or other users. If and to the extent we
            process information for our own operational, security, billing,
            analytics, legal, or service administration purposes, we may act as
            an independent controller or business under applicable law.
          </p>
          <p>
            By accessing, configuring, or using the Service, including by
            connecting a WhatsApp number, completing a setup acknowledgement, or
            accepting these Terms, the Customer and User grant us a broad,
            continuing authorization to communicate with the User through any
            contact channel associated with the Service, including WhatsApp,
            email, SMS, in-app notifications, and any other messaging channel
            linked during setup or use. This authorization covers all categories
            of communications we determine to be related to the Service,
            including but not limited to onboarding, introductions, activation,
            feature announcements, usage guidance, product updates, support,
            billing, account administration, service status, security notices,
            partnership or integration opportunities, surveys, feedback
            requests, promotional offers, and any other communications we
            reasonably deem relevant to the User&apos;s relationship with the
            Service.
          </p>
          <p>
            The Customer and User acknowledge that all communications sent under
            this authorization are authorized communications made pursuant to
            the User&apos;s acceptance of these Terms and are not unsolicited,
            unauthorized, or otherwise unlawful. This consent is recorded at the
            time of account setup or Terms acceptance and remains valid unless
            and until the User affirmatively withdraws consent by disconnecting
            their account or contacting us in writing. Withdrawal of consent
            operates prospectively only and does not retroactively affect the
            lawfulness or authorization of any communication sent prior to
            withdrawal, nor does it create grounds for any claim, demand, or
            legal action based on communications sent during the period of valid
            consent.
          </p>

          <h2>7. Security and Credential Handling</h2>
          <p>
            You are responsible for maintaining the confidentiality of login
            credentials, secure links, API keys, cookies, admin access,
            invitation codes, and any other authentication artifacts associated
            with your use of the Service. You must promptly notify us of any
            suspected compromise, unauthorized disclosure, suspicious
            authentication event, or unauthorized Service access. We may, but
            are not obligated to, suspend or rotate credentials, invalidate
            sessions, disable features, or require re-authentication where we
            reasonably believe such action is necessary for security or
            compliance reasons.
          </p>

          <h2>8. Fees, Billing, Taxes, and Payment Processors</h2>
          <p>
            If the Service or any feature is offered on a paid basis, you agree
            to pay all applicable fees, charges, taxes, and assessments in
            accordance with the pricing, billing cadence, and payment terms
            presented to you. We may use third-party payment processors and
            billing portals, and your use of those services may be subject to
            separate terms. Except where prohibited by law, fees are
            non-refundable once incurred, and taxes, duties, levies, or similar
            governmental charges are your responsibility other than taxes based
            solely on our net income.
          </p>

          <h2>9. Service Changes, Suspension, and Discontinuation</h2>
          <p>
            We may modify, add, remove, limit, or discontinue features,
            integrations, APIs, dashboards, workflows, pricing, plans, or
            support channels at any time. We may suspend or restrict access to
            the Service, in whole or in part, immediately and without liability,
            if we reasonably determine that: (a) you have violated these Terms;
            (b) your use presents a security, fraud, abuse, legal, or platform
            compliance risk; (c) a Third-Party Platform has suspended or
            restricted the relevant integration; (d) continued performance could
            expose us or another party to legal or regulatory risk; or (e)
            suspension is necessary for maintenance, emergency remediation, or
            incident response.
          </p>

          <h2>
            10. Data Retention, Evidence Preservation, and Deletion Requests
          </h2>
          <p>
            Upon account termination or receipt of a deletion request, we will
            process the request in accordance with our Privacy Policy and
            applicable law. Notwithstanding any deletion request, we reserve the
            right to retain any information, including personal data, account
            records, consent records, communications metadata, configuration
            history, setup acknowledgements, operational logs, and security
            event data, for as long as reasonably necessary to: (a) establish,
            exercise, or defend legal claims; (b) comply with legal, regulatory,
            tax, accounting, or audit obligations; (c) respond to or cooperate
            with governmental or regulatory investigations; (d) enforce these
            Terms; (e) prevent fraud, abuse, or security incidents; or (f)
            protect the rights, property, or safety of us, our users, or third
            parties.
          </p>
          <p>
            Where a user or former user has threatened, initiated, or indicated
            an intent to initiate legal proceedings, regulatory complaints, or
            other adversarial actions against us, we may place a litigation hold
            on all data associated with that user and retain such data
            indefinitely until the matter is fully and finally resolved. A
            deletion request submitted during or after such a threat or
            proceeding will not override our retention rights under this
            section, and we will inform the requestor of any applicable
            limitation.
          </p>

          <h2>11. Intellectual Property and Feedback</h2>
          <p>
            We and our licensors retain all right, title, and interest in and to
            the Service, including all software, designs, interfaces,
            documentation, workflows, trade dress, know-how, and derivative
            works, other than Customer Data and third-party materials. Subject
            to these Terms, we grant you a limited, revocable, non-exclusive,
            non-transferable right to access and use the Service for your
            internal business purposes during the applicable service period.
          </p>
          <p>
            If you provide suggestions, ideas, recommendations, bug reports, or
            other feedback relating to the Service, you grant us a worldwide,
            perpetual, irrevocable, transferable, sublicensable, royalty-free
            right to use that feedback for any lawful purpose without
            restriction or compensation, provided that we will not publicly
            identify you as the source of feedback without your permission
            unless otherwise required by law.
          </p>

          <h2>12. Confidentiality</h2>
          <p>
            Each party receiving non-public information from the other
            (&quot;Confidential Information&quot;) will use at least reasonable
            care to protect the confidentiality of that information and will not
            use or disclose it except as necessary to perform under the
            governing agreement, exercise rights under the agreement, comply
            with law, or protect against fraud, abuse, or security incidents.
            Confidential Information does not include information that is or
            becomes public through no fault of the receiving party, was already
            known without restriction, is independently developed without use of
            the disclosing party&apos;s Confidential Information, or is lawfully
            received from a third party without a duty of confidentiality.
          </p>

          <h2>13. Warranties and Disclaimers</h2>
          <p>
            THE SERVICE IS PROVIDED ON AN &quot;AS IS,&quot; &quot;AS
            AVAILABLE,&quot; AND &quot;WITH ALL FAULTS&quot; BASIS. TO THE
            MAXIMUM EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES,
            REPRESENTATIONS, CONDITIONS, AND UNDERTAKINGS, WHETHER EXPRESS,
            IMPLIED, STATUTORY, OR OTHERWISE, INCLUDING ANY IMPLIED WARRANTIES
            OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE,
            NON-INFRINGEMENT, QUIET ENJOYMENT, ACCURACY, COMPLETENESS, OR
            FREEDOM FROM INTERRUPTION, ERROR, HARMFUL CODE, OR SECURITY
            VULNERABILITY. WE DO NOT WARRANT THAT THE SERVICE WILL MEET YOUR
            REQUIREMENTS, BE AVAILABLE AT ALL TIMES, OPERATE WITHOUT DELAY,
            MAINTAIN COMPATIBILITY WITH ANY THIRD-PARTY PLATFORM, OR ELIMINATE
            THE NEED FOR YOUR OWN LEGAL, COMPLIANCE, SECURITY, AND OPERATIONAL
            REVIEW.
          </p>

          <h2>14. Indemnification</h2>
          <p>
            You agree to defend, indemnify, and hold harmless us and our
            affiliates, officers, directors, personnel, contractors, agents,
            licensors, and service providers from and against any claims,
            proceedings, liabilities, losses, damages, penalties, judgments,
            settlements, costs, and expenses (including reasonable
            attorneys&apos; fees) arising out of or relating to: (a) your use of
            the Service; (b) Customer Data; (c) your violation of these Terms;
            (d) your violation of applicable law or third-party rights; (e) your
            failure to obtain required notices, permissions, or legal bases; (f)
            any dispute between you and a third party concerning communications,
            records, CRM data, consent, privacy, or platform authorization; or
            (g) any claim, demand, threat, or legal proceeding initiated by you
            or on your behalf that is determined by a court of competent
            jurisdiction or arbitrator to be frivolous, vexatious, brought in
            bad faith, or without reasonable legal or factual basis, including
            demands relating to service communications that were authorized
            under these Terms at the time they were sent.
          </p>
          <p>
            If you direct a legal demand, threat, or claim at us that relates to
            service communications sent during a period of valid consent under
            these Terms, you acknowledge that we may: (i) retain all records of
            your account, consent, setup, communications, and interactions
            indefinitely for defensive and evidentiary purposes; (ii) disclose
            such records to legal counsel, courts, regulators, insurers, and
            other parties as reasonably necessary; and (iii) pursue recovery of
            our legal costs, fees, and damages to the fullest extent permitted
            by applicable law if such demand is determined to be without merit.
          </p>

          <h2>15. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT WILL WE OR OUR
            AFFILIATES, LICENSORS, OR SERVICE PROVIDERS BE LIABLE FOR ANY
            INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE
            DAMAGES, OR FOR ANY LOSS OF PROFITS, REVENUE, BUSINESS, GOODWILL,
            DATA, EXPECTED SAVINGS, OR BUSINESS OPPORTUNITY, EVEN IF ADVISED OF
            THE POSSIBILITY OF SUCH DAMAGES. OUR AGGREGATE LIABILITY FOR ALL
            CLAIMS ARISING OUT OF OR RELATING TO THE SERVICE OR THESE TERMS WILL
            NOT EXCEED THE GREATER OF: (A) THE FEES PAID BY YOU TO US FOR THE
            SERVICE DURING THE TWELVE (12) MONTHS PRECEDING THE EVENT GIVING
            RISE TO THE CLAIM; OR (B) ONE HUNDRED UNITED STATES DOLLARS (US
            $100), IF NO FEES WERE PAID.
          </p>
          <p>
            The foregoing limitations apply regardless of the theory of
            liability, including contract, tort, negligence, strict liability,
            statute, restitution, misrepresentation, or otherwise, and
            notwithstanding any failure of essential purpose of any limited
            remedy. Nothing in these Terms limits liability that cannot lawfully
            be excluded or limited under applicable law.
          </p>

          <h2>16. Compliance with Local Law; Non-Waivable Rights</h2>
          <p>
            The Service may be used across multiple jurisdictions, including the
            EU, UK, United States, Brazil, Mexico, Argentina, Colombia, and
            other countries in Latin America and elsewhere. Laws in those
            jurisdictions may impose mandatory privacy, consumer, employment,
            telecommunications, electronic messaging, record retention,
            cybersecurity, or public policy requirements that cannot be waived
            by contract. These Terms will be interpreted, to the extent
            reasonably possible, in a manner consistent with such mandatory
            requirements. If a provision of these Terms is unenforceable in a
            given jurisdiction solely because a local law provides a broader
            non-waivable protection, that provision will be enforced to the
            maximum extent permitted, and the remainder of the Terms will remain
            in effect.
          </p>

          <h2>17. Export Controls and Sanctions</h2>
          <p>
            You may not use, export, re-export, transfer, or make the Service
            available in violation of applicable export control or sanctions
            laws. You represent and warrant that you are not located in, under
            the control of, or ordinarily resident in a restricted jurisdiction
            to the extent such use would violate applicable law, and that you
            are not using the Service for a prohibited end use or on behalf of a
            prohibited person.
          </p>

          <h2>18. Governing Law and Forum</h2>
          <p>
            Except to the extent prohibited by a non-waivable law of your
            jurisdiction, these Terms and any dispute, claim, or controversy
            arising out of or relating to the Service or these Terms will be
            governed by the laws of the State of Wyoming, United States of
            America, without regard to conflict-of-laws principles. Subject to
            any mandatory forum rights that cannot lawfully be excluded, the
            parties consent to the exclusive jurisdiction and venue of the state
            and federal courts located in or serving Wyoming, and each party
            waives any objection based on inconvenient forum or similar
            doctrine.
          </p>

          <h2>19. Miscellaneous</h2>
          <p>
            These Terms constitute the entire agreement between you and us
            regarding the Service except for any separate written agreement,
            order form, subscription document, or data processing addendum that
            expressly supplements them. We may assign these Terms in connection
            with a corporate transaction, reorganization, sale of assets, or by
            operation of law. You may not assign or transfer these Terms without
            our prior written consent. Our failure to enforce any provision will
            not constitute a waiver. If any provision is held unenforceable, the
            remaining provisions will remain in full force and effect.
          </p>

          <h2>20. Contact</h2>
          <p>
            Questions about these Terms may be directed to{' '}
            <a href="mailto:hello@appstronauts.shop">hello@appstronauts.shop</a>
            .
          </p>

          <p>Last Updated: March 21, 2026</p>
        </div>
      </main>
    </div>
  );
}
