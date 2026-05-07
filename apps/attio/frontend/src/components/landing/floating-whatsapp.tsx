import React from 'react';

export const FloatingWhatsApp = () => {
  const phoneNumber = '917999709798';
  const message = 'Hi, I need help with the Attio WhatsApp integration.';
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-lg hover:shadow-2xl bg-green-600 hover:-translate-y-1 transition-all duration-300"
      aria-label="Contact us on WhatsApp"
    >
      <span className="sr-only">Contact us on WhatsApp</span>
      <svg
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        className="w-8 h-8"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M12.031 0C5.385 0 0 5.386 0 12.03c0 2.128.552 4.196 1.6 6.02L.004 24l6.105-1.602A11.968 11.968 0 0 0 12.03 24c6.645 0 12.03-5.385 12.03-12.03 0-6.646-5.385-12.03-12.03-12.03zm6.657 17.15c-.266.748-1.53 1.348-2.115 1.411-.53.056-1.22.127-3.905-.98-3.23-1.332-5.305-4.634-5.464-4.846-.16-.214-1.306-1.745-1.306-3.33 0-1.583.824-2.373 1.116-2.693.291-.32.64-.401.85-.401.21 0 .423.003.606.012.2.01.468-.077.732.557.266.642.905 2.215.986 2.376.08.16.133.348.026.56-.107.214-.16.348-.32.535-.16.187-.34.401-.48.56-.16.186-.33.393-.133.731.192.338.86 1.428 1.848 2.308 1.278 1.139 2.352 1.492 2.671 1.638.32.147.507.133.694-.08.187-.213.8-1.026 1.013-1.373.213-.347.426-.293.72-.187.293.107 1.865.88 2.186 1.04.32.16.533.24.613.373.08.134.08.775-.187 1.523z" />
      </svg>
    </a>
  );
};
