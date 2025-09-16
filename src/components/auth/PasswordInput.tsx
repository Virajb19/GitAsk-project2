import { useState } from "react"
import { EyeIcon, EyeOffIcon } from 'lucide-react';

type Props = {
    placeholder: string,
    field: any
}

export default function PasswordInput({placeholder, field} : Props) {

 const [showPassword,setShowPassword] = useState(false)

  return <div className="relative w-full flex items-center">
  <input {...field} type={showPassword ? 'password' : 'text'} className="input-style w-full" placeholder={placeholder || '••••••••'}/>
  <span onClick={() => setShowPassword(!showPassword)} 
   className="absolute right-5 p-2 rounded-lg cursor-pointer hover:bg-muted duration-200">{showPassword ? <EyeIcon /> : <EyeOffIcon />}</span>
  </div>     
}