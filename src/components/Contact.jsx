import React from 'react'
import { MdInsertLink } from "react-icons/md";

export default function Contact() {
  return (
    <section className="bg-white pt-20 md:h-[75%]">
        <div className='px-20'>
            <div className="mx-auto px-6 text-center">
                <h1 className="text-[56px] leading-none tracking-[0.08em] font-extrabold uppercase">
                ПОЧУЙТЕ МЕНЕ
                </h1>

                <p className="mx-auto mt-8 text-[22px] text-black">
                Залиште нам повідомлення, питання або проблему та ми на неї відповімо тут
                </p>
            <div className='flex flex-row justify-center items-center text-white w-full mt-6'>
                <a
                href="https://forms.gle/xzxotfPdR7TJ8ppH8"
                target="_blank"
                rel="noreferrer"
                className='flex justify-center items-center bg-black p-2.5 px-4'
                >
                <span className="inline-flex h-10 w-10 items-center justify-center">
                        <MdInsertLink size={48}/>
                </span>

                <span className="text-[22px] tracking-[0.04em]">
                    https://forms.gle/xzxotfPdR7TJ8ppH8
                </span>
                </a>
            </div>

                <p className="mx-auto mt-6 text-[20px] text-neutral-400 pb-20">
                Форма є повністю анонімною, всі ваші особисті <br />дані не потрапляють до обробки
                </p>
            </div>
      </div>
      <div className="w-full h-[20vh] bg-black"></div>
    </section>
  );
}