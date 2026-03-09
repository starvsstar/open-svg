import type { AppProps } from 'next/app';
import 'swagger-ui-dist/swagger-ui.css';
import '../styles/swagger-ui.css';

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default MyApp; 