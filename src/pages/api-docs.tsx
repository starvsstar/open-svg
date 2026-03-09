import { useEffect } from 'react';
import SwaggerUIBundle from 'swagger-ui-dist/swagger-ui-bundle.js';
import 'swagger-ui-dist/swagger-ui.css';

function ApiDocs() {
  useEffect(() => {
    SwaggerUIBundle({
      dom_id: '#swagger-ui',
      url: '/api/swagger',
      deepLinking: true,
      presets: [
        SwaggerUIBundle.presets.apis,
        SwaggerUIBundle.SwaggerUIStandalonePreset
      ],
    });
  }, []);

  return <div id="swagger-ui" />;
}

// 这个配置告诉 Next.js 在服务端渲染时不要尝试导入 swagger-ui
ApiDocs.getInitialProps = () => {
  return { props: {} };
};

export default ApiDocs; 