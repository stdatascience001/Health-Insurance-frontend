
import React, { useState } from "react";

export const ContactUs: React.FC = () => {
  const [selectedSubject, setSelectedSubject] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Do not display a successful submission until the API confirms it.
    alert("The contact form is ready. Please connect the contact API to send inquiries.");
  };

  return (
    <main className="contact-page">
      {/* HERO SECTION */}
      <section className="contact-hero">
        <div className="contact-hero-content">
          <span className="contact-eyebrow">
            <span className="contact-eyebrow-dot" />
            WE'RE HERE FOR YOU
          </span>

          <h1>
            Let's take care of
            <span> your health, together.</span>
          </h1>

          <p>
            Whether you have questions about our insurance plans,
            need assistance with an application, or require policy
            support, we're always happy to help.
          </p>

          <div className="contact-hero-points">
            <span>✓ Personal assistance</span>
            <span>✓ Clear guidance</span>
            <span>✓ Customer-first support</span>
          </div>
        </div>

        <div className="contact-hero-visual">
          <img
            src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=1000&auto=format&fit=crop&q=85"
            alt="Healthcare professional"
          />

          <div className="contact-image-overlay">
            <div className="contact-overlay-icon">♥</div>
            <div>
              <strong>Your health comes first</strong>
              <span>We're here whenever you need us.</span>
            </div>
          </div>

          <div className="contact-image-decoration" />
        </div>
      </section>

      {/* SUPPORT CARDS */}
      <section className="contact-support-section">
        <div className="contact-section-heading">
          <span className="contact-section-label">HOW CAN WE HELP?</span>
          <h2>We're here for every step of your journey.</h2>
          <p>
            Find the right assistance for your healthcare insurance needs.
          </p>
        </div>

        <div className="contact-support-grid">
          <div className="contact-support-card">
            <div className="contact-card-icon teal">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <h3>Insurance Plans</h3>
            <p>
              Need help understanding coverage, premiums, benefits or
              choosing the right insurance plan?
            </p>
            <span className="contact-card-footer">Plan Assistance <span>→</span></span>
          </div>

          <div className="contact-support-card">
            <div className="contact-card-icon blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6M8 13h8M8 17h8" />
              </svg>
            </div>
            <h3>Applications & Policies</h3>
            <p>
              Get assistance with application status, policy details,
              renewals and account-related questions.
            </p>
            <span className="contact-card-footer">Policy Assistance <span>→</span></span>
          </div>

          <div className="contact-support-card">
            <div className="contact-card-icon rose">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8z" />
              </svg>
            </div>
            <h3>Claims Support</h3>
            <p>
              Have questions about cashless hospitalization,
              reimbursement or the claims process?
            </p>
            <span className="contact-card-footer">Claims Assistance <span>→</span></span>
          </div>
        </div>
      </section>

      {/* CONTACT FORM SECTION */}
      <section className="contact-form-section">
        <div className="contact-form-info">
          <span className="contact-section-label">GET IN TOUCH</span>
          <h2>Have a question? We'd love to hear from you.</h2>
          <p>
            Fill out the form and tell us how we can assist you.
            Share your query and we'll help you find the right direction.
          </p>

          <div className="contact-info-image">
            <img
              src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=85"
              alt="Healthcare professional using digital technology"
            />
            <div className="contact-info-image-caption">
              <strong>Care that goes beyond coverage.</strong>
              <span>Because your well-being matters to us.</span>
            </div>
          </div>

          <div className="contact-trust-note">
            <span>✓</span>
            Your information is handled with care and confidentiality.
          </div>
        </div>

        <div className="contact-form-card">
          <div className="contact-form-heading">
            <div>
              <h3>Send us a message</h3>
              <p>All fields marked with * are required.</p>
            </div>
            <div className="contact-form-icon">✉</div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="contact-form-row">
              <div className="contact-field">
                <label htmlFor="contact-name">Full Name *</label>
                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  placeholder="Enter your full name"
                  required
                  maxLength={100}
                />
              </div>

              <div className="contact-field">
                <label htmlFor="contact-email">Email Address *</label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  maxLength={254}
                />
              </div>
            </div>

            <div className="contact-field">
              <label htmlFor="contact-phone">Phone Number</label>
              <input
                id="contact-phone"
                name="phone"
                type="tel"
                placeholder="Enter your phone number"
                maxLength={20}
              />
            </div>

            <div className="contact-field">
              <label htmlFor="contact-subject">How can we help you? *</label>
              <select
                id="contact-subject"
                name="subject"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                required
              >
                <option value="" disabled>Select a subject</option>
                <option value="General Inquiry">General Inquiry</option>
                <option value="Insurance Plans">Insurance Plans</option>
                <option value="Application Support">Application Support</option>
                <option value="Policy Related">Policy Related</option>
                <option value="Claims Support">Claims Support</option>
                <option value="Technical Support">Technical Support</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="contact-field">
              <label htmlFor="contact-message">Your Message *</label>
              <textarea
                id="contact-message"
                name="message"
                placeholder="Tell us how we can help you..."
                rows={5}
                required
                maxLength={2000}
              />
              <span className="contact-field-hint">
                Please don't include sensitive medical or financial information.
              </span>
            </div>

            <button type="submit" className="contact-submit-btn">
              Send Message
              <span>→</span>
            </button>

            <p className="contact-form-disclaimer">
              By submitting this form, you agree that we may use your
              information to respond to your inquiry.
            </p>
          </form>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="contact-bottom-cta">
        <div>
          <span>YOUR HEALTH. OUR PRIORITY.</span>
          <h2>We're always happy to help.</h2>
          <p>
            Explore our insurance plans and take the next step
            towards better healthcare protection.
          </p>
        </div>
        <a href="/" className="contact-cta-btn">
          Explore Insurance Plans <span>→</span>
        </a>
      </section>
    </main>
  );
};
