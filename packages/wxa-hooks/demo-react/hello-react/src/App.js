import { useEffect, useState, useMemo } from 'react';
import logo from './logo.svg';
import './App.css';
import { Comp } from './com';

let a = [1, 2, 3];
function App() {
  let [name, setName] = useState(1);
  let [age, setAge] = useState(1);

  // Promise.resolve().then(()=>console.log('resolve'))
  // setName('222');
  console.log('app');

  // useEffect(() => {
  //   setTimeout(() => {
  //     set()
  //   }, 2000);
  // }, []);

  // useEffect(() => {
  //   console.log('app effect');

  // }, [name]);



  // useEffect(()=>{
  //   console.log('app effect')
  // }, [name]);


  let set = () => {
    // setName((pre,cur)=>{
    //   console.log(pre);
    //   return pre+1
    // });
    process.nextTick(() => {
      console.log("ppp");
    })

    setName(name+1)
    console.log('ss');

    // setName((pre,cur)=>{
    //   console.log(pre);
    //   return pre+1
    // });

    // setName(name+1)
    // setName(name+1)
  };

  const memoizedValue = useMemo(() => {
    console.log('memo');
      // Promise.resolve().then(()=>{
      //   console.log('ppp');
      // })
      setAge(age + 1)
  },[name]);


  return (
    <div className='App'>
      <header className='App-header' onMouseDown={() => set()}>
        <img src={logo} className='App-logo' alt='logo' />
        <Comp name={name}></Comp>
        {age}
        <p>{name.toString()}</p>
        <a
          className='App-link'
          href='https://reactjs.org'
          target='_blank'
          rel='noopener noreferrer'
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
