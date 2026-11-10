
import React, { useState } from "react";
import {
  FiHelpCircle,
  FiMessageCircle,
  FiMail,
  FiBookOpen,
  FiChevronDown,
  FiSearch
} from "react-icons/fi";
import "./HelpSupport.css";

const faqs = [
  {
    question: "How do I upload room photographs?",
    answer: "Open Upload Room, select your room type, and choose your room photographs using the upload area."
  },
  {
    question: "Which image formats are supported?",
    answer: "You can upload PNG, JPG, JPEG, and WEBP images."
  },
  {
    question: "How can I customize my 3D room?",
    answer: "Open the 3D Interior Editor to explore the room preview and available furniture tools."
  },
  {
    question: "Can I save my interior design?",
    answer: "The current EDVR interface is a frontend prototype. Persistent project saving will be available after backend integration."
  },
  {
    question: "Can I manage multiple projects?",
    answer: "The My Projects page currently demonstrates project listing and filtering. Database-backed project management can be integrated later."
  }
];

function HelpSupport() {
  const [search, setSearch] = useState("");
  const [activeFaq, setActiveFaq] = useState(null);

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="help-page">
      <header className="help-header">
        <h1>Help & Support</h1>
        <p>Find answers and learn how to use EDVR Interior Studio.</p>
      </header>

      <section className="help-banner">
        <div>
          <span>EDVR SUPPORT CENTER</span>
          <h2>How can we help you?</h2>
          <p>Explore guides and frequently asked questions about your interior design workspace.</p>

          <div className="help-search">
            <FiSearch />
            <input
              placeholder="Search your questions..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="help-banner-icon">
          <FiHelpCircle />
        </div>
      </section>

      <section className="help-options">
        <article className="help-option-card">
          <div className="help-option-icon"><FiBookOpen /></div>
          <h3>Getting Started</h3>
          <p>Learn the basics of uploading rooms and exploring your design workspace.</p>
        </article>

        <article className="help-option-card">
          <div className="help-option-icon"><FiMessageCircle /></div>
          <h3>Design Assistance</h3>
          <p>Understand the available room editing and furniture customization tools.</p>
        </article>

        <article className="help-option-card">
          <div className="help-option-icon"><FiMail /></div>
          <h3>Contact Support</h3>
          <p>Find support contact information for assistance with your workspace.</p>
        </article>
      </section>

      <section className="faq-section">
        <div className="faq-heading">
          <h2>Frequently Asked Questions</h2>
          <p>Common questions about EDVR.</p>
        </div>

        <div className="faq-list">
          {filteredFaqs.length ? filteredFaqs.map((faq, index) => (
            <div className="faq-item" key={index}>
              <button
                className="faq-question"
                onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                aria-expanded={activeFaq === index}
              >
                <span>{faq.question}</span>
                <FiChevronDown className={activeFaq === index ? "rotated" : ""} />
              </button>

              {activeFaq === index && (
                <p className="faq-answer">{faq.answer}</p>
              )}
            </div>
          )) : (
            <p className="faq-empty">No matching questions found.</p>
          )}
        </div>
      </section>
    </div>
  );
}

export default HelpSupport;
