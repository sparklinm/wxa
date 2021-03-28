import { useEffect, useState } from 'react'

export function Comp(props) {
  let [v, setV] = useState(100)
  // console.log('comp')

  // useEffect(()=>{
  //     console.log("comp Effect ", props.name )
  //     Promise.resolve().then(()=>{
  //       console.log('ppp');
  //     })
  //     setV(v + 10)
  // }, [props.name])

  // useEffect(()=>{
  //   console.log("comp second Effect ")
  // }, [v])

  return (
    <div>
      <input
        placeholder="input your account balance"
        value={v}
        onInput={e => setV(e.value)}
      />
      {props.name}
    </div>
  )
}
