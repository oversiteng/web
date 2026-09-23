"use client";

import React, { useState } from "react";
import styles from "./WaitlistModal.module.css";
import { IconCheck } from "@/components/ui/Icons";

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPlan?: string;
}

const AVAILABLE_SERVICES = [
  {
    id: "monitoring",
    label: "Property & Building Project Monitoring / Errand Requests",
    desc: "Get real-time photo/video site updates and errand verification on demand.",
  },
  {
    id: "vendor_verification",
    label: "Vendor & Contractor Verification",
    desc: "Background checks and on-ground audits of suppliers and contractors.",
  },
  {
    id: "security_law",
    label: "Law Enforcement / Security & Escort Assistance",
    desc: "Verified security escorts and police log report assistance.",
  },
  {
    id: "analytics_valuation",
    label: "Property Valuation & Estate Data Analytics",
    desc: "Valuer-backed projections, policy changes, and landmark value impacts.",
  },
  {
    id: "emergency_inspection",
    label: "Emergency Contact & On-Ground Inspection",
    desc: "Rapid deployment inspector assigned for urgent property incidents.",
  },
];

export default function WaitlistModal({ isOpen, onClose, defaultPlan = "Basic Tier (Free)" }: WaitlistModalProps) {
  const [step, setStep] = useState<"form" | "submitted">("form");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([
    "monitoring",
    "vendor_verification",
  ]);
  const [selectedPlan, setSelectedPlan] = useState<string>(defaultPlan);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const toggleService = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const selectAllServices = () => {
    if (selectedServices.length === AVAILABLE_SERVICES.length) {
      setSelectedServices([]);
    } else {
      setSelectedServices(AVAILABLE_SERVICES.map((s) => s.id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setStep("submitted");
    }, 600);
  };

  const handleResetAndClose = () => {
    setStep("form");
    onClose();
  };

  return (
    <div className={styles.backdrop} onClick={onClose} >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()
      }>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal" >
          & times;
        </button >

        {step === "form" ? (
          <div>
            <div className={styles.header} >
              <span className={styles.badge} > Priority Waitlist</span >
              <h2 > Get Early Access to Oversite.ng</h2 >
              <p>
                Reserve your <strong > Free Tier Spot</strong > and tell us which services you need help with right now.
              </p >
            </div >

            < form onSubmit={handleSubmit} className={styles.form} >
              {/* Personal Info */}
              <div className={styles.formGroup} >
                <label htmlFor="fullName" > Full Name</label >
                <input
                  id="fullName"
                  type="text"
                  required
                  placeholder="e.g. Chukwuma Adeniyi"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={styles.input}
                />
              </div >

              <div className={styles.rowTwo} >
                <div className={styles.formGroup} >
                  <label htmlFor="email" > Email Address</label >
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={styles.input}
                  />
                </div >

                <div className={styles.formGroup} >
                  <label htmlFor="phone" > WhatsApp / Phone</label >
                  <input
                    id="phone"
                    type="tel"
                    required
                    placeholder="+234 801 234 5678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={styles.input}
                  />
                </div >
              </div >

              {/* Service Selection Checklist */}
              <div className={styles.servicesSection} >
                <div className={styles.servicesHeader} >
                  <label className={styles.sectionLabel} >
                    Select Services You Need Currently:
                  </label >
                  <button
                    type="button"
                    className={styles.selectAllBtn}
                    onClick={selectAllServices}
                  >
                    {selectedServices.length === AVAILABLE_SERVICES.length
                      ? "Deselect All"
                      : "Select All"}
                  </button >
                </div >

                <div className={styles.servicesGrid} >
                  {
                    AVAILABLE_SERVICES.map((serv) => {
                      const isChecked = selectedServices.includes(serv.id);
                      return (
                        <div
                          key={serv.id}
                          className={
                            `${styles.serviceCard} ${isChecked ? styles.serviceCardSelected : ""
                            } `}
                          onClick={() => toggleService(serv.id)}
                        >
                          <div className={`${styles.customCheck} ${isChecked ? styles.customCheckChecked : ""} `}>
                            {isChecked && <IconCheck className={styles.customCheckIcon} />}
                          </div>
                          <div className={styles.serviceText}>
                            <strong>{serv.label}</strong>
                            <span>{serv.desc}</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Plan Tier Choice */}
              <div className={styles.planChoiceRow}>
                <label className={styles.sectionLabel}>Starting Plan Tier:</label>
                <div className={styles.planOptions}>
                  <button
                    type="button"
                    className={`${styles.planChip} ${selectedPlan.includes("Basic") ? styles.planChipActive : ""
                      } `}
                    onClick={() => setSelectedPlan("Basic Tier (Free Reserved)")}
                  >
                    Basic (Free Reserved)
                  </button>
                  <button
                    type="button"
                    className={`${styles.planChip} ${selectedPlan.includes("Premium") ? styles.planChipActive : ""
                      } `}
                    onClick={() => setSelectedPlan("Premium Tier (₦50,000 Priority Access)")}
                  >
                    Premium (Priority Waitlist &bull; ₦50,000)
                  </button>
                </div>
              </div>

              {/* Payment Notice for Premium Plan */}
              {selectedPlan.includes("Premium") && (
                <div className={styles.paymentNoticeBox}>
                  <div className={styles.paymentNoticeHeader}>
                    <span className={styles.paymentBadge}>Priority Onboarding &bull; ₦50,000 Deposit</span>
                  </div>
                  <p>
                    Premium Priority Waitlist reserves an instant dedicated manager, zero queue delay, and ₦50,000 initial platform credit upon launch.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || selectedServices.length === 0}
                className={styles.submitBtn}
              >
                {submitting
                  ? "Processing..."
                  : selectedPlan.includes("Premium")
                    ? "Proceed to ₦50,000 Payment & Reserve"
                    : "Claim Free Early Access"}
              </button>
            </form>
          </div>
        ) : (
          <div className={styles.successState}>
            <div className={styles.successIconWrap}>
              <IconCheck className={styles.successIcon} />
            </div>
            <h2>You&apos;re on the Early Access List!</h2>
            <p>
              Thank you, <strong>{fullName}</strong>. We have reserved your spot on the{" "}
              <strong>{selectedPlan}</strong> with priority onboarding for your selected services.
            </p>

            {selectedPlan.includes("Premium") ? (
              <div className={styles.successDetails}>
                <p style={{ fontWeight: 700, color: "var(--primary)", marginBottom: "4px" }}>
                  Payment Link &amp; Order Invoice Sent!
                </p>
                <span>Check <strong>{email}</strong> or WhatsApp (<strong>{phone}</strong>) for your ₦50,000 priority access invoice.</span>
              </div>
            ) : (
              <div className={styles.successDetails}>
                <span>We will notify you at <strong>{email}</strong> as soon as your access opens.</span>
              </div>
            )}

            <button className={styles.submitBtn} onClick={handleResetAndClose}>
              Back to Overview
            </button>
          </div>
        )}
      </div>
    </div >
  );
}
