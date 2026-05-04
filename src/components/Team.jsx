import React from 'react'

const people = [
  {
    id: "1",
    name: "МАРІЯ КРОПИВКА",
    role: "ДИЗАЙНЕР & РОЗРОБНИК",
    bio: "Журналістка, студентка",
    imageUrl: "MaKa.jpg",
  },
  {
    id: "2",
    name: "НАДІЯ ВАРДАНЯН",
    role: "МЕНЕДЖЕР ПРОЄКТУ",
    bio: "Журналістка, студентка",
    imageUrl: "NaVa.jpg",
  },
  {
    id: "3",
    name: "ДАРИНА АДАМАЙТІС",
    role: "РЕДАКТОР",
    bio: "Журналістка, студентка",
    imageUrl: "DaAd.jpg",
  },
  {
    id: "4",
    name: "ВАЛЕРІЯ НЕМЕРОВЕЦЬ",
    role: "SMM & МАРКЕТИНГ",
    bio: "Журналістка, студентка",
    imageUrl: "VaNe.jpg",
  },
];

function TeamCard({ person }) {
  return (
    <div className="w-full">
      <div className="aspect-square w-full overflow-hidden bg-neutral-200">
        <img
          src={person.imageUrl}
          alt={person.name}
          className="h-full w-full object-cover grayscale"
          loading="lazy"
        />
      </div>

      <div className="pt-2">
        <div className="text-[22px] font-extrabold tracking-[0.06em]">
          {person.name}
        </div>

        <div className="mt-1 text-[16px] text-neutral-500 font-bold">
          {person.role}
        </div>
        <div className="mt-0.5 text-[16px] text-neutral-400">
          {person.bio}
        </div>
      </div>
    </div>
  );
}

function Team() {
  return (
    <div className='pt-18 pb-0 flex flex-col justify-center items-center px-20'>
        <h1 className='text-4xl'>НАША КОМАНДА</h1>
        <section className="bg-white">
            <div className="mx-auto max-w-[1100px] px-6 py-10">
                <div className="grid grid-cols-2 gap-x-8 gap-y-10">
                    {people.map((person) => (
                    <TeamCard key={person.id} person={person} />))}
                </div>
            </div>
        </section>
    </div>
  )
}

export default Team