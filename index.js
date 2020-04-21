const { ApolloServer } = require("apollo-server")
const typeDefs = require("./db/schema")
const resolvers = require("./db/resolvers")
const connectDB = require("./config/db")
const jwt = require("jsonwebtoken")

// Conectar on la base de datos
connectDB()

// Crear el servidor
const server = new ApolloServer({
    typeDefs, 
    resolvers,
    context: ({req}) => {
        // console.log(req.headers["authorization"]);
        const token = req.headers["authorization"] || ""
        if(token) {
            try {
                
                const user = jwt.verify(token, process.env.SECRET)
                return { user }

            } catch (error) {
                console.log("hubo un error", error);
            }
        }
    }
})

// Arrancar el servidor
server.listen().then(({url}) => {
    console.log(`Servidor listo en: ${url}`);
})
