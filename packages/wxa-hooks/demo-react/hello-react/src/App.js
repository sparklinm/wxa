import { useEffect, useState, useMemo } from 'react';
import logo from './logo.svg';
import './App.css';
import { Comp } from './com';

let a = [1, 2, 3];
function App() {
  let [name, setName] = useState(1);
  let [age, setAge] = useState(1);
  let [obj, setObj] = useState({});

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



  useEffect(()=>{
    console.log('app effect')
  }, [obj]);


  let set = () => {
    // setName((pre,cur)=>{
    //   console.log(pre);
    //   return pre+1
    // });
    // process.nextTick(() => {
    //   console.log("ppp");
    // })



    // setName((pre)=>{
    //   console.log('pre', pre);
    //   return 555
    // })

    // setName((pre)=>{
    //   console.log('pre', pre);
    //   return 5555
    // })

    // obj.a=11111111111111
    // setObj({...obj})

    // setName((pre,cur)=>{
    //   console.log(pre);
    //   return pre+1
    // });
    setTimeout(() => {
      setName(2)
      setName(3)
      setName(4)
    }, 0);
    
  };

  const memoizedValue = useMemo(() => {
    console.log(name);
      // Promise.resolve().then(()=>{
      //   console.log('ppp');
      // })
  },[name]);


  return (
    <div className='App'>
      <header className='App-header' onMouseDown={() => set()}>
        <img src={logo} className='App-logo' alt='logo' />
        <Comp name={name}></Comp>
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
