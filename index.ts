import { Server } from './src/server';
import { Request, Response } from "express";

enum METHOD {
    GET = 'get',
    POST = 'post'
}

const server = new Server();

class Routes {
    @routeLog()
    @routesAuth('123')
    @routeConfig({
        method: METHOD.GET,
        path: "/hello"
    })
    public anyNameYouLike(
        request: Request,
        response: Response
    ) {
        return "Hello World!";
    }
}

interface RouteConfigProps {
    method: METHOD;
    path: string;
}

function routeConfig({method, path}: RouteConfigProps): MethodDecorator {
    return function (
        target: Object,
        propertyKey: string | symbol,
        descriptor: PropertyDescriptor
    ) {
        const response = (req: Request, res: Response) => {
            const original = descriptor.value(req, res);

            res.status(200).json(original);
        }

        server.app[method](path, response);
    }
}

function routeLog(): MethodDecorator {
    return function (
        target: Object,
        propertyKey: string | symbol,
        descriptor: PropertyDescriptor
    ) {
        const original = descriptor.value;

        descriptor.value = function (...args: any[]) {
            let request = args[0] as Request;

            const {
                url,
                method,
                body,
                headers,
            } = request;

            console.log("[LOG]", {
                url,
                method,
                body,
                headers,
            });
            return original.apply(this, args);
        }
    };
}

export function routesAuth(key: string): MethodDecorator {
    return function (
        target: Object,
        propertyKey: string | symbol,
        descriptor: PropertyDescriptor
    ) {
        const original = descriptor.value;
        descriptor.value = function (...args: any[]) {

            const request = args[0] as Request;
            const response = args[1] as Response;

            const headers = request.headers;

            if (headers.authorization === `Bearer ${key}`) {
                return original.apply(this, args);
            }
            response.status(403).json({error: "Not Authorized"});
        }
    }
}

server.start();