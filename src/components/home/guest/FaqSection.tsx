"use client";

import { useId, useState } from "react";
import { MinusIcon, PlusIcon } from "@/components/common/Icons";
import { SectionHeading } from "@/components/common/SectionHeading";
import { FAQ_ITEMS } from "@/data/faq";
import layout from "./section.module.css";
import styles from "./FaqSection.module.css";

/** 자주 묻는 질문. 첫 항목이 펼쳐진 상태가 시안의 초기 상태 */
export function FaqSection() {
  const baseId = useId();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" aria-labelledby="faq-title" className={styles.section}>
      <div className={layout.container}>
        <div className={styles.headingWrap}>
          <SectionHeading
            id="faq-title"
            eyebrow="FAQ"
            label="자주 묻는 질문"
            title="궁금한 점이 있으신가요?"
            align="center"
          />
        </div>

        <ul className={styles.list}>
          {FAQ_ITEMS.map((item, index) => {
            const open = openIndex === index;
            const buttonId = `${baseId}-q${index}`;
            const panelId = `${baseId}-a${index}`;
            return (
              <li key={item.question} className={styles.item}>
                <h3 className={styles.heading}>
                  <button
                    id={buttonId}
                    type="button"
                    className={styles.question}
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => setOpenIndex(open ? null : index)}
                  >
                    <span>{item.question}</span>
                    <span
                      className={`${styles.icon} ${open ? styles.iconOpen : ""}`}
                      aria-hidden="true"
                    >
                      {open ? <MinusIcon size={16} /> : <PlusIcon size={16} />}
                    </span>
                  </button>
                </h3>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className={styles.answer}
                  hidden={!open}
                >
                  <p>{item.answer}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
