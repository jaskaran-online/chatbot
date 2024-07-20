import Image from 'next/image'
import FloatingChatbot from "@/components/FloatingChatbot";

export default function Home() {
  return <main className='flex flex-col items-center justify-center h-screen bg-gradient-to-r from-indigo-900 to-teal-700'>
  <Image src="https://ivalt.com/wp-content/themes/t466jHjHxHAGxHAGqd_ivalt/images/logohome.png" className=""
  width="300" height="200" alt="Ivalt Logo" />
    <FloatingChatbot />
  </main>
}
