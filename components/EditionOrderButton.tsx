"use client";

import { useState } from "react";

type EditionOrderButtonProps = {
    email: string;
    label: string;
    copiedLabel: string;
    instruction: string;
    responseNote: string;
};

function fallbackCopy(value: string) {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    return copied;
}

export default function EditionOrderButton({
    email,
    label,
    copiedLabel,
    instruction,
    responseNote,
}: EditionOrderButtonProps) {
    const [copied, setCopied] = useState(false);

    const copyEmail = async () => {
        let didCopy = false;

        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(email);
                didCopy = true;
            }
        } catch {
            didCopy = false;
        }

        if (!didCopy) {
            didCopy = fallbackCopy(email);
        }

        setCopied(didCopy);
    };

    return (
        <div className="edition-order-action">
            <button
                type="button"
                className={`edition-order-button${copied ? " copied" : ""}`}
                onClick={copyEmail}
                aria-label={copied ? `${email} ${copiedLabel}` : label}
            >
                <span>{copied ? email : label}</span>
                {copied && <span className="edition-copy-badge">{copiedLabel}</span>}
            </button>

            <p className="edition-order-instruction">
                {instruction} {" "}
                <a href={`mailto:${email}`}>
                    {email}
                </a>
            </p>
            <p className="edition-response-note">{responseNote}</p>
        </div>
    );
}
