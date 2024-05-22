import React, { useState} from 'react'
//import { Provider, useWallet } from '@txnlab/use-wallet'
//import Account from './Account'

interface MethodCallInterface {
  methodFunction: () => Promise<void>,
  text: string
}

const MethodCall = ({ methodFunction, text }: MethodCallInterface) => {

    const [loading, setLoading] = useState(false)
    
    const callMethodFuncion = async () => { 
        setLoading(true)
        await methodFunction()
        setLoading(false)
    }


    return (
        <button className="btn m-2" onClick={callMethodFuncion}> 
            {loading? <span className='loading loading-spinner'> Loading... </span> : <span> {text} </span> }
        </button>
    )
  
}
export default MethodCall
