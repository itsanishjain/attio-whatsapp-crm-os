import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/privacy')({
  component: PrivacyPolicy,
});

function PrivacyPolicy() {
  return (
    <div className="mx-4 mb-40 mt-8 flex max-w-4xl flex-col antialiased md:flex-row lg:mx-auto">
      <main className="mt-6 flex min-w-0 flex-auto flex-col px-2 md:px-0">
        <h1 className="mb-6 text-3xl font-bold">Privacy Policy</h1>
        <div className="prose prose-lg max-w-none space-y-4 text-md">
          <p>
            This Privacy Policy describes the information handling practices
            applicable to Attio WhatsApp Sync, including our websites,
            application interfaces, APIs, connected services, customer support
            interactions, operational security functions, billing flows, and
            related business activities that reference or incorporate this
            Privacy Policy (collectively, the &quot;Service&quot;). This
            document is intended to operate as a global baseline notice and, to
            the extent required by applicable law, a supplemental regional
            notice for individuals located in, or whose personal data is
            otherwise regulated by, jurisdictions including the European
            Economic Area (&quot;EEA&quot;), the United Kingdom
            (&quot;UK&quot;), Switzerland, the United States, Brazil, Mexico,
            Argentina, Colombia, and other jurisdictions with materially
            analogous data protection or consumer privacy requirements.
          </p>

          <p>
            Because the Service is designed to connect business communication
            systems with customer relationship management workflows, our role
            can vary depending on the context. In many circumstances, a customer
            using the Service determines which contacts, conversations,
            attributes, records, or workspaces are connected, and we process
            that information on the customer&apos;s behalf. In other
            circumstances, we independently determine the purposes and means of
            processing for account administration, fraud prevention, billing,
            product analytics, service improvement, legal compliance, security
            monitoring, and dispute management. When applicable law draws
            distinctions among concepts such as &quot;controller,&quot;
            &quot;processor,&quot; &quot;business,&quot; &quot;service
            provider,&quot; &quot;operator,&quot; &quot;responsável,&quot;
            &quot;operador,&quot; &quot;responsable,&quot; and
            &quot;encargado,&quot; those distinctions will apply according to
            the facts of the relevant processing activity.
          </p>

          <h2>1. Scope, Applicability, and Interpretive Priority</h2>
          <p>
            This Privacy Policy applies to personal data, personal information,
            or equivalent legally protected information that we collect, use,
            disclose, transmit, store, analyze, secure, or otherwise process in
            connection with the Service. It does not apply to information that
            has been irreversibly anonymized or de-identified in accordance with
            applicable law, or to data processed exclusively by third-party
            platforms under their own independent terms and notices where we do
            not receive or control that information.
          </p>
          <p>
            If you are using the Service through an organization, workspace,
            employer, agency, or principal account holder, that organization may
            separately control your use of the Service and may provide
            independent notices, policies, contractual instructions, or
            acceptable-use requirements. In the event of a conflict between this
            Privacy Policy and a separate written data processing addendum or
            other negotiated agreement between us and a customer, the negotiated
            agreement will control to the extent of the conflict with respect to
            customer-controlled data, except where applicable law requires a
            different result.
          </p>

          <h2>2. Categories of Information We Process</h2>
          <p>
            Depending on the manner in which the Service is configured and used,
            we may process the following categories of information:
          </p>
          <ul>
            <li>
              <strong>Account, identity, and contact data</strong>, including
              names, business email addresses, phone numbers, session
              identifiers, team membership data, invite metadata, authentication
              tokens, and account administration records.
            </li>
            <li>
              <strong>Integration and credential data</strong>, including
              credentials, tokens, encrypted connection state, scoped API
              permissions, device linkage state, refresh or verification
              artifacts, and other technical information required to establish,
              maintain, secure, or terminate connections between the Service and
              supported third-party systems.
            </li>
            <li>
              <strong>Communications and CRM-linked data</strong>, including
              message text, timestamps, directionality, associated contact
              names, phone identifiers, note metadata, conversation linkage
              data, selected groups, filtering preferences, and related
              synchronization outputs written to or read from customer systems.
            </li>
            <li>
              <strong>Transactional and commercial data</strong>, including plan
              status, subscription or billing metadata, payment processor
              references, service configuration choices, and customer support or
              contractual records.
            </li>
            <li>
              <strong>Device, network, and usage data</strong>, including IP
              address, approximate geolocation inferred from network metadata,
              browser or operating system information, diagnostic logs, error
              traces, webhook payload metadata, routing data, security events,
              and product interaction telemetry.
            </li>
            <li>
              <strong>Support, feedback, and operational communications</strong>
              , including inquiries, support tickets, product feedback,
              survey-style submissions, complaint records, follow-up
              correspondence, service communication preferences, and records of
              onboarding, support, billing, trial, or outage-related notices
              sent through approved channels, including WhatsApp where enabled
              by the user.
            </li>
            <li>
              <strong>Sensitive or special-category information</strong>, only
              to the extent that such information is embedded in customer
              communications, imported customer records, or support materials
              that a customer or user elects to process through the Service. We
              do not intentionally require special-category or sensitive
              personal data for the ordinary consumer-facing operation of the
              Service and ask customers not to use the Service for regulated or
              high-risk processing unless they have independently determined the
              Service is appropriate and lawful for that use case.
            </li>
          </ul>

          <h2>3. Sources of Information</h2>
          <p>
            We may collect information directly from you, from the organization
            that provides your access to the Service, from connected third-party
            platforms such as Attio, WhatsApp-related integrations, Meta,
            payment processors, support channels, analytics tools,
            infrastructure providers, and security or anti-abuse systems. We may
            also derive information from raw operational events, customer
            configurations, synchronization outcomes, service logs, and
            integrity checks used to determine connection health, billing
            status, and access rights.
          </p>
          <p>
            If you choose a linked-device WhatsApp connection method instead of
            an official WhatsApp Business connection method, we may also process
            technical events and metadata associated with linked-device pairing,
            session continuity, enforcement reviews, re-authentication prompts,
            restrictions, suspensions, revocations, or bans initiated by
            WhatsApp, Meta, or related Third-Party Platforms. The existence of
            such events does not mean we control them; they are generated by or
            arise from Third-Party Platform behavior and may affect the
            availability of the Service for the affected account.
          </p>

          <h2>4. Purposes of Processing and Legal Bases</h2>
          <p>
            Subject to applicable law, we process information for the following
            purposes:
          </p>
          <ul>
            <li>
              To provision, authenticate, operate, maintain, troubleshoot, and
              improve the Service.
            </li>
            <li>
              To connect, synchronize, format, transmit, receive, reconcile, or
              present communications and CRM-related records across integrated
              systems.
            </li>
            <li>
              To administer accounts, team access, settings, support requests,
              invoices, subscriptions, and business relationships.
            </li>
            <li>
              To communicate with users through any contact channel associated
              with the Service, including WhatsApp, email, SMS, in-app
              notifications, and other messaging channels linked during setup or
              use, for any purpose we determine to be related to the Service,
              including onboarding, introductions, activation, feature
              announcements, usage guidance, product updates, support, billing,
              account administration, service status, security notices,
              partnership or integration opportunities, surveys, feedback
              requests, promotional offers, and any other communications
              reasonably related to the User&apos;s relationship with the
              Service.
            </li>
            <li>
              To secure the Service, detect or prevent misuse, fraud, spam,
              abuse, unauthorized access, unlawful conduct, policy violations,
              and operational failures.
            </li>
            <li>
              To analyze product usage, service quality, performance, and
              reliability, including through session replay, diagnostics,
              logging, and analytics technologies used to understand feature
              adoption and product issues.
            </li>
            <li>
              To comply with legal obligations, respond to lawful requests,
              establish or defend legal claims, enforce contracts, and preserve
              evidence.
            </li>
          </ul>
          <p>
            Where the GDPR, UK GDPR, Swiss data protection rules, LGPD, or
            similar laws apply, the legal bases for the above processing may
            include: performance of a contract; taking steps at your request
            before entering into a contract; compliance with legal obligations;
            our legitimate interests or the legitimate interests of our
            customers, users, and counterparties in secure, auditable, and
            reliable business communications and CRM operations; and, where
            required, consent. If we rely on consent, you may withdraw it at any
            time, although that will not affect the lawfulness of processing
            before withdrawal and may not affect processing carried out on
            another lawful basis.
          </p>
          <p>
            By connecting a WhatsApp account to the Service, accepting these
            Terms, or completing a setup acknowledgement, the user affirmatively
            provides consent to receive communications through any channel
            associated with the Service, including WhatsApp, for any purpose we
            determine to be related to the Service or the user&apos;s
            relationship with us. This consent is recorded at the time of
            account setup and constitutes a valid, informed, and freely given
            consent for purposes of applicable electronic communications,
            telecommunications, and data protection laws. The user may withdraw
            this consent at any time by disconnecting their account from the
            Service or by contacting us at the address provided below; however,
            withdrawal of consent does not affect the lawfulness of
            communications sent prior to withdrawal, nor does it create a
            retroactive right to characterize prior authorized communications as
            unsolicited or unlawful.
          </p>
          <p>
            If a user elects to connect through a linked-device WhatsApp method
            rather than an official WhatsApp Business method, that choice may
            carry a different account-risk profile, including the possibility
            that WhatsApp, Meta, or a related platform reviews, restricts,
            suspends, disables, or bans the connected account, number, business
            asset, or linked device. We process information associated with
            those account-status events to operate, secure, troubleshoot, and
            document the Service, but we do not control the underlying
            enforcement decision.
          </p>

          <h2>5. Disclosures to Third Parties</h2>
          <p>
            We may disclose information to the following categories of
            recipients, subject to applicable law and appropriate contractual or
            statutory safeguards:
          </p>
          <ul>
            <li>
              Hosting, cloud, storage, observability, security, customer
              support, email, and infrastructure vendors that help us operate
              the Service.
            </li>
            <li>
              Integrated third-party platforms designated by the customer or
              necessary to provide the Service, including CRM systems,
              messaging-related providers, and payment processors.
            </li>
            <li>
              Professional advisers, auditors, insurers, financing sources,
              legal counsel, and potential acquirers in connection with
              corporate transactions, diligence, or risk management.
            </li>
            <li>
              Governmental authorities, regulators, courts, law enforcement, or
              counterparties where disclosure is required or reasonably
              necessary to comply with law, protect rights, or prevent harm.
            </li>
            <li>Other parties at your direction or with your authorization.</li>
          </ul>
          <p>
            We do not represent that every disclosure will be characterized
            identically under every statute. To the extent a particular U.S.
            state law, consumer privacy framework, or similar regime treats a
            disclosure differently than we do for ordinary commercial purposes,
            we will interpret and address the disclosure as required by the
            applicable law governing that processing activity.
          </p>

          <h2>6. Cookies, Local Storage, and Similar Technologies</h2>
          <p>
            We use cookies, local storage, and similar technologies to maintain
            sessions, preserve setup acknowledgements, remember product
            preferences, measure usage, understand feature adoption, improve the
            Service, and support analytics, diagnostics, attribution, and
            security functions. Some of these technologies may be operated by
            third-party analytics or infrastructure providers acting on our
            behalf. You can manage certain browser-side technologies through
            your browser or device settings, but disabling them may affect the
            availability or functionality of parts of the Service.
          </p>

          <h2>7. International Data Transfers</h2>
          <p>
            The Service may involve cross-border processing and storage of
            personal data in jurisdictions other than the jurisdiction in which
            the data originated. Where required by applicable law, we implement
            transfer mechanisms intended to provide an adequate level of
            protection, which may include adequacy decisions, standard
            contractual clauses approved by the European Commission, the UK
            International Data Transfer Agreement or the UK Addendum, and other
            lawfully recognized mechanisms, assessments, or supplementary
            measures. Operational necessity alone does not eliminate transfer
            compliance obligations; accordingly, transfer practices may be
            adapted over time to reflect regulatory developments, vendor
            changes, or new guidance.
          </p>

          <h2>8. Retention</h2>
          <p>
            We retain personal data for the period reasonably necessary to
            fulfill the purposes described in this Privacy Policy, including to
            maintain active integrations, preserve synchronized records that the
            customer has chosen to create, troubleshoot service incidents,
            maintain security and audit integrity, comply with tax and
            accounting obligations, defend or resolve disputes, and meet legal
            or regulatory requirements. Retention periods vary based on the
            nature of the data, the sensitivity of the processing, the
            contractual relationship, the existence of litigation or
            investigations, and the feasibility of deletion or de-identification
            without undermining service integrity, security, or evidentiary
            obligations.
          </p>
          <p>
            Without limiting the foregoing, we reserve the right to retain any
            information, including personal data, account records,
            communications metadata, consent records, configuration history, and
            operational logs, for as long as reasonably necessary to establish,
            exercise, or defend legal claims, respond to regulatory inquiries,
            comply with litigation hold obligations, or protect our rights,
            property, or safety, even after an account has been terminated or a
            deletion request has been submitted. A deletion request will not
            override retention that is required by law or reasonably necessary
            for the establishment, exercise, or defense of legal claims, and we
            will inform the requestor of any such limitation.
          </p>

          <h2>9. Security</h2>
          <p>
            We use administrative, technical, organizational, and physical
            safeguards designed to reduce the risk of unauthorized access,
            destruction, loss, alteration, disclosure, or misuse of data. These
            safeguards may include encryption in transit and at rest where
            applicable, access controls, segmentation, credential handling
            protections, logging, rate limiting, change management, secure
            development practices, and incident response procedures. No method
            of transmission, storage, or processing is absolutely secure, and
            therefore we cannot guarantee absolute security.
          </p>

          <h2>10. Children and Restricted Uses</h2>
          <p>
            The Service is intended for business and professional use and is not
            directed to children. We do not knowingly market the Service to
            children or intentionally collect personal information directly from
            children in a manner that would trigger child-specific consent or
            notice obligations. Customers remain responsible for evaluating
            whether the Service is suitable for their own industry, sector, or
            regulated use cases, including healthcare, financial services,
            employment, minors&apos; data, or other high-risk categories.
          </p>

          <h2>11. Automated Decision-Making and Profiling</h2>
          <p>
            The Service may use rules-based automation, filtering logic,
            deduplication, matching heuristics, synchronization conditions, and
            operational diagnostics to route records, suppress configured
            content, or determine whether particular messages or records should
            be synchronized, displayed, retried, or blocked. We do not describe
            these functions as decisions producing legal or similarly
            significant effects on individuals for purposes of applicable
            privacy laws unless and until a particular deployment context,
            customer workflow, or law requires that characterization.
          </p>

          <h2>12. Regional Notices and Supplemental Rights</h2>
          <h3>EEA, UK, and Switzerland</h3>
          <p>
            Individuals in the EEA, UK, and Switzerland may have rights, subject
            to legal limitations and exemptions, including the right to request
            access to personal data; rectification of inaccurate or incomplete
            personal data; erasure; restriction of processing; objection to
            processing based on legitimate interests or direct marketing; data
            portability in a structured, commonly used, and machine-readable
            format where applicable; withdrawal of consent; and complaint to a
            competent supervisory authority. Where we process
            customer-controlled data solely on behalf of a customer, we may
            refer the request to the relevant customer or require the request to
            be submitted through the customer.
          </p>
          <p>
            If the GDPR or UK GDPR applies, we may rely on Article 6(1)(b),
            6(1)(c), 6(1)(f), and, where necessary, 6(1)(a) legal bases or their
            local analogues. Where international transfers are restricted, we
            may rely on adequacy, SCCs, the UK Addendum, the UK IDTA, or other
            recognized safeguards, together with supplementary measures where
            appropriate.
          </p>

          <h3>United States</h3>
          <p>
            Residents of certain U.S. states may have rights under applicable
            state privacy laws, including rights to know or confirm whether
            personal information is processed; access specific pieces or
            categories of personal information; correct inaccuracies; delete
            personal information; obtain portable copies of certain personal
            information; opt out of certain processing for targeted advertising,
            sale, sharing, or profiling in furtherance of decisions producing
            legal or similarly significant effects; appeal a refusal of a
            request where such appeal rights apply; and exercise rights through
            an authorized agent where permitted by law. Rights, exceptions,
            definitions, and verification standards vary materially by state,
            and some rights may not apply to all data categories or all users.
          </p>
          <p>
            We do not state that every disclosure, analytics event, or
            operational transfer is exempt from every statutory definition of
            &quot;sale,&quot; &quot;sharing,&quot; or &quot;targeted
            advertising&quot; in every state. Instead, we evaluate those
            concepts according to the applicable law governing the relevant
            processing context and will handle verified requests accordingly. We
            do not discriminate unlawfully against individuals for exercising
            applicable privacy rights.
          </p>

          <h3>Brazil</h3>
          <p>
            To the extent the LGPD applies, titulares may have rights including
            confirmation of the existence of processing, access, correction of
            incomplete, inaccurate, or outdated data, anonymization, blocking or
            deletion of unnecessary or excessive data or data processed in
            non-compliance with the LGPD, portability where applicable, deletion
            of personal data processed with consent, information about public
            and private entities with which data has been shared, information
            about the possibility of denying consent and the consequences of
            such denial, revocation of consent, and petition to the ANPD,
            subject to legal limitations and operational feasibility.
          </p>

          <h3>Mexico</h3>
          <p>
            Where Mexican privacy law applies, individuals may have ARCO rights
            (access, rectification, cancellation, and opposition), as well as
            rights to revoke consent or limit the use or disclosure of personal
            data, subject to applicable legal conditions, identity verification,
            and exceptions. Requests should clearly describe the right being
            exercised and provide sufficient information to locate the relevant
            records.
          </p>

          <h3>Argentina, Colombia, and Other LATAM Jurisdictions</h3>
          <p>
            Depending on the applicable law, individuals in Argentina, Colombia,
            and other Latin American jurisdictions may have rights to be
            informed, access, update, rectify, suppress, object to, or otherwise
            contest the processing of personal data, as well as rights
            associated with habeas data or local data protection procedures. If
            a local law grants a broader or more specific right than this notice
            expressly describes, we will interpret this Privacy Policy in a
            manner intended to preserve that non-waivable right.
          </p>

          <h2>13. How to Exercise Privacy Rights</h2>
          <p>
            To submit a privacy request, contact{' '}
            <a href="mailto:hello@appstronauts.shop">hello@appstronauts.shop</a>
            . We may request additional information to verify identity,
            authority, residency, or the scope of the request. We may deny,
            limit, or defer a request to the extent permitted by applicable law,
            including where we cannot verify identity, where the request is
            manifestly unfounded or excessive, where disclosure would adversely
            affect the rights of another person, where an exemption applies, or
            where we act solely on behalf of a customer and the request must be
            directed to that customer. If applicable law grants a right to
            appeal a denial, we will provide information about that process in
            our response.
          </p>

          <h2>14. Abusive, Vexatious, or Bad-Faith Requests</h2>
          <p>
            We reserve the right to decline, limit, defer, or charge a
            reasonable fee for requests that are manifestly unfounded,
            excessive, repetitive, vexatious, or made in bad faith, to the
            extent permitted by applicable law. We also reserve the right to
            retain records of such requests, including the identity and
            communications of the requestor, for the purpose of establishing,
            exercising, or defending legal claims and protecting against abuse
            of rights-request mechanisms. Threatening, coercive, or legally
            abusive communications directed at us, our personnel, or our service
            providers in connection with a rights request may be retained
            indefinitely and disclosed to legal counsel, insurers, courts, and
            regulatory authorities as reasonably necessary.
          </p>

          <h2>15. Changes to This Privacy Policy</h2>
          <p>
            We may revise this Privacy Policy from time to time to reflect
            changes in the Service, legal requirements, vendor relationships,
            operational practices, or regulatory guidance. The version posted on
            this page will include an updated effective date. Material changes
            may be communicated through the Service, by email, or through other
            appropriate means where required by law.
          </p>

          <h2>16. Contact Information</h2>
          <p>
            Privacy-related inquiries, verified rights requests, complaints, or
            questions about this Privacy Policy may be directed to{' '}
            <a href="mailto:hello@appstronauts.shop">hello@appstronauts.shop</a>
            .
          </p>

          <p>Last Updated: March 21, 2026</p>
        </div>
      </main>
    </div>
  );
}
