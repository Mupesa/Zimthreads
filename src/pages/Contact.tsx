import { useState } from "react"
import { useStore } from "@/store/StoreContext"
import {
  MailIcon,
  PhoneIcon,
  LocationIcon,
  ClockIcon,
  CheckIcon,
} from "@/components/Icons"

export default function Contact() {
  const { addInquiry, settings } = useStore()
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.subject || !form.message) return

    addInquiry({
      name: form.name,
      email: form.email,
      subject: form.subject,
      message: form.message,
    })

    setSent(true)
  }

  const handleSendAnother = () => {
    setForm({ name: "", email: "", subject: "", message: "" })
    setSent(false)
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
      <div className="mb-12">
        <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-[#4a5c2d] mb-3">
          Get In Touch
        </p>
        <h1 className="font-display text-[clamp(2.5rem,6vw,5rem)] font-extrabold uppercase text-[#1a1a1a]">
          CONTACT US
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
        {/* Info */}
        <div>
          <p className="text-[#6b7280] text-sm sm:text-base leading-relaxed mb-10">
            Have questions about our sneaker restoration services, bulk custom
            apparel, or want to discuss a bespoke project? Reach our studio team
            directly or leave a message.
          </p>
          <div className="space-y-6">
            {[
              { label: "Email", value: settings.email, icon: MailIcon },
              {
                label: "Phone / WhatsApp",
                value: settings.phone,
                icon: PhoneIcon,
              },
              {
                label: "Studio Location",
                value: settings.location,
                icon: LocationIcon,
              },
              {
                label: "Business Hours",
                value: settings.hours,
                icon: ClockIcon,
              },
            ].map((c) => {
              const IconComp = c.icon
              return (
                <div key={c.label} className="flex gap-4 items-start">
                  <div className="w-10 h-10 border border-[#e5e1d8] flex items-center justify-center text-[#4a5c2d] flex-shrink-0 bg-white">
                    <IconComp className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-[#6b7280]">
                      {c.label}
                    </p>
                    <p className="text-sm font-semibold text-[#1a1a1a] mt-0.5">
                      {c.value}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Form */}
        {sent ? (
          <div className="flex flex-col items-center justify-center border border-[#e5e1d8] bg-white p-8 sm:p-12 text-center shadow-xs">
            <div className="w-14 h-14 rounded-full bg-[#4a5c2d] flex items-center justify-center mb-4 text-white">
              <CheckIcon className="w-6 h-6" />
            </div>
            <h2 className="font-display text-2xl font-extrabold uppercase text-[#1a1a1a] mb-2">
              MESSAGE DISPATCHED
            </h2>
            <p className="text-[#6b7280] text-sm max-w-sm mb-6">
              Thank you, <strong>{form.name}</strong>. Your inquiry has been
              received. Our team will follow up within 24 hours.
            </p>
            <button
              onClick={handleSendAnother}
              className="px-6 py-3 border border-[#1a1a1a] text-[11px] font-bold tracking-widest uppercase text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-[#f5f2ec] transition-colors"
            >
              SEND ANOTHER MESSAGE
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-4 sm:space-y-5 bg-white border border-[#e5e1d8] p-6 sm:p-8"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold tracking-widest uppercase text-[#6b7280] block mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-[#e5e1d8] bg-[#f5f2ec] px-4 py-3 text-sm text-[#1a1a1a] focus:outline-none focus:border-[#4a5c2d]"
                  placeholder="e.g. Farai Mutasa"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold tracking-widest uppercase text-[#6b7280] block mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-[#e5e1d8] bg-[#f5f2ec] px-4 py-3 text-sm text-[#1a1a1a] focus:outline-none focus:border-[#4a5c2d]"
                  placeholder="e.g. farai@example.com"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold tracking-widest uppercase text-[#6b7280] block mb-1">
                Subject *
              </label>
              <input
                type="text"
                required
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full border border-[#e5e1d8] bg-[#f5f2ec] px-4 py-3 text-sm text-[#1a1a1a] focus:outline-none focus:border-[#4a5c2d]"
                placeholder="e.g. Sneaker restoration inquiry"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold tracking-widest uppercase text-[#6b7280] block mb-1">
                Message *
              </label>
              <textarea
                required
                rows={5}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full border border-[#e5e1d8] bg-[#f5f2ec] px-4 py-3 text-sm text-[#1a1a1a] focus:outline-none focus:border-[#4a5c2d] resize-none"
                placeholder="How can our studio team assist you?"
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-[#4a5c2d] text-[#f5f2ec] text-[11px] font-bold tracking-widest uppercase hover:bg-[#5a7038] transition-colors"
            >
              SEND MESSAGE
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
