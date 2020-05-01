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
        if(token !== "") {
            try {
                
                const user = jwt.verify(token.replace("Bearer ", ""), process.env.SECRET)
                return { user }

            } catch (error) {
                return null
            }
        }
        else 
            return null
    }
})

// Arrancar el servidor, con puerto
server.listen({ port:process.env.PORT || 4000 }).then(({url}) => {
    console.log(`Servidor listo en: ${url}`);
})
