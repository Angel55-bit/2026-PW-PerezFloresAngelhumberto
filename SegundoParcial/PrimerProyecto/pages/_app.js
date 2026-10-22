import Menu from '../primer-proyecto-next/componentes/Menu'
import '../style.css/'

export default function App({Component, pageProps}){
    return(
        <> 
            <Menu />
            <Component {...pageProps}/>
        </>
    )
}