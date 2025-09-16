"use client";

import SwaggerUI from "swagger-ui-react";
import SwaggerUIProps from "swagger-ui-react/swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

function ReactSwagger({ spec }: SwaggerUIProps) {
    return <SwaggerUI spec={spec} />;
}

export default ReactSwagger;
