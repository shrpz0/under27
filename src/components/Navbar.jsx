import React from 'react'
import { FaUser } from "react-icons/fa"

function Navbar({ activeTab, onTabClick, onHomeClick, onProfileClick }) {
  const tabs = ["LOVE", "MIND", "DIGITAL", "WORK", "VOICES"]

  return (
    <div className='flex flex-row justify-between items-center px-6 py-2'>
      <div
        className='text-[40px] cursor-pointer select-none'
        onClick={onHomeClick}
      >
        UNDER 27
      </div>

      <div className="flex flex-row gap-14 border-b-2 border-b-[#D4D4D4]">
        {tabs.map((tab) => (
          <div
            key={tab}
            onClick={() => onTabClick(tab)}
            className={`
              px-3 cursor-pointer 
              ${activeTab === tab ? "border-b-2 border-black -mb-[2px]" : ""}
            `}
          >
            <h4>{tab}</h4>
          </div>
        ))}
      </div>

      <button
        onClick={onProfileClick}
        className="cursor-pointer"
        aria-label="Open admin"
      >
        <FaUser size={40} />
      </button>
    </div>
  )
}

export default Navbar

