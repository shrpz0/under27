import React from 'react'
import { motion } from "framer-motion"
import { GoChevronDown } from "react-icons/go"
import EncryptedText from "./UI/EncryptedText"
import Shuffle from './UI/Shuffle';

function Hero() {
  return (
    <div className='flex pt-20 flex-col h-[85%]'>

      <div className='flex flex-row justify-around items-center px-16'>
        <div className='flex flex-col text-8xl'>

          <h1>ЛЮБИ</h1>
          <h1>ТВОРИ</h1>
          <h1>НЕРВУЙ</h1>
        </div>

        <div>
          <h4>Ми створили це медіа,</h4>
          <h4>щоб розбирати те,</h4>
          <h4>що відбувається всередині,</h4> 
          <h4>поки зовні всі роблять вигляд,</h4>
          <h4 className='mb-1'>що все ок.</h4>
          <h4>Але не ок.</h4>
        </div>
      </div>

      <div className='flex flex-row justify-center mt-auto'>
        <motion.div
          animate={{ y: [0, 12, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <GoChevronDown size={84} />
        </motion.div>
      </div>
    </div>
  )
}

export default Hero