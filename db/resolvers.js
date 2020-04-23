const bcryptjs = require("bcryptjs")
const jwt = require("jsonwebtoken")
require("dotenv").config({path: "variables.env"})
const User = require("../models/User")
const Product = require("../models/Product")
const Client = require("../models/Client")
const Order = require("../models/Order")

const createToken = (user, secret, expiresIn) => {
    const { id, name, email, lastName } = user

    return jwt.sign({
        id,
        name, 
        email,
        lastName
    }, secret, {
        expiresIn
    })
}

// Resolvers
// GraphQL filtra automaticamente los datos que recibe del servidor, como sacar solo la tecnologia
// Los itera o saca de acuerdo a los types que hayamos definido
const resolvers = {
    Query: {
        // Usuarios
        getUser: async (_, { }, ctx) => {
            if(ctx && ctx.user)
                return ctx.user
            else 
                throw new Error("No autorizado") 
        },

        // Productos
        getProducts: async () => {
            try {
                
                const products = await Product.find({})
                return products

            } catch (error) {
                console.log(error);
            }
        },

        getProduct: async (_, { id }) => {
            // Revisar si el producto existe o no
            const product = await Product.findById(id)

            if(!product) throw new Error("Producto no encontrado")

            return product

        },

        // Clientes
        getClients: async () => {
            try {
                
                const clients = await Client.find({})
                return clients

            } catch (error) {
                console.log(error);
            }
        },

        getClientSeller: async (_, {}, ctx) => {

            if(ctx && ctx.user)
                try {
                    
                    const clients = await Client.find({ seller: ctx.user.id.toString() })
                    return clients

                } catch (error) {
                    console.log(error);
                }
            else 
                throw new Error("No autorizado") 
        },

        getClient: async (_, { id }, ctx) => {

            if(ctx && ctx.user) {
                
                // Revisar si el cliente existe
                const client = await Client.findById(id)
    
                if(!client) throw new Error("El cliente no existe")
    
                // Quien lo creo lo puede ver
                if(client.seller.toString() !== ctx.user.id) 
                    throw new Error("No tienes la credenciales")
    
                return client
            }
            else 
                throw new Error("No autorizado") 
        },

        // Pedidos
        getOrders: async () => {
            try {

                const orders = await Order.find({})
                return orders

            } catch (error) {
                console.log(error);
            }
        },

        getOrdersSeller: async (_, {}, ctx) => {
            
            try {

                const orders = await Order.find({ seller: ctx.user.id })
                return orders

            } catch (error) {
                console.log(error);
            }

        },

        getOrder: async (_, { id }, ctx) => {

            // Verificar si el pedido existe
            const order = await Order.findById(id)

            if(!order) throw new Error("Pedido no encontrado")

            // Solo quien lo creo lo puede ver
            if(order.seller.toString() !== ctx.user.id)
                throw new Error("No tienes las crenciales")

            // Retornar
            return order
        },

        getOrderStatus: async (_, { status }, ctx) => {
            const orders = await Order.find({ seller: ctx.user.id, status })

            return orders
        },

        // Consultas avanzadas
        bestClients: async () => {
            const clients = await Order.aggregate([
                { $match: { status: "COMPLETADO" } },
                { $group: {
                    _id: "$client",
                    total: { $sum: "$total" }
                }},
                {
                    $lookup: {
                        from: "clients",
                        localField: "_id",
                        foreignField: "_id",
                        as: "client"
                    }
                }, 
                {
                    $sort: { total: -1}
                },
                {
                    $limit: 10
                }
            ])

            return clients
        },

        bestSeller: async () => {
            const sellers = await Order.aggregate([
                { $match: { status: "COMPLETADO" } },
                { $group: {
                    _id: "$seller",
                    total: { $sum: "$total" }
                }},
                {
                    $lookup: {
                        from: "users",
                        localField: "_id",
                        foreignField: "_id",
                        as: "seller"
                    }
                },
                {
                    $sort: { total: -1 }
                },
                {
                    $limit: 3
                }
            ])

            return sellers
        },

        searchProduct: async (_, { text }) => {
            const products = await Product.find({ $text: { $search: text } }).limit(10)

            return products
        },
    },

    Mutation: {
        // Usuarios
        createUser: async (_, { input }) => {

            const { email, password } = input

            // Revisar si el usuario esta registrado
            const isAlreadyUser = await User.findOne({email})

            if(isAlreadyUser) throw new Error("El usuario ya esta registrado")

            // Hashear el password
            const salt = await bcryptjs.genSalt(10)
            input.password = await bcryptjs.hash(password, salt)

            try {
                // Guardarlo en la base de datos
                const user = new User(input)
                user.save()
                return user
            } catch (error) {
                console.log(error);
            }
        },

        authenticateUser: async (_, { input }) => {
            const { email, password } = input

            // Si el usuario existe
            const existUser = await User.findOne({ email })

            if(!existUser) throw new Error("El usuario o contraseña son erroneos")

            // Revisar si el password es correcto
            const correctPassword = await bcryptjs.compare(password, existUser.password)

            if(!correctPassword) throw new Error("El usuario o contraseña son erroneos")

            // Crear el token
            return {
                token: createToken(existUser, process.env.SECRET, "24h")
            }
        },

        // Productos
        createProduct: async (_, { input }) => {
            try {

                const product = new Product(input)
                
                // Guardar en la BD
                const result = await product.save()

                return result

            } catch (error) {
                console.log(error);
            }
        },

        updateProduct: async (_, { id, input }) => {
            // Revisar si el producto existe o no
            let product = await Product.findById(id)

            if(!product) throw new Error("Producto no encontrado")  

            // Actualizarlo
            product = await Product.findOneAndUpdate({ _id: id }, input, { new: true })

            return product
        },

        deleteProduct: async (_, { id }) => {
            // Revisar si el producto existe o no
            let product = await Product.findById(id)

            if(!product) throw new Error("Producto no encontrado")  

            await Product.findOneAndDelete({ _id: id })

            return "Producto Eliminado"
        },

        // Clientes
        createClient: async (_, { input }, ctx) => {

            if(ctx && ctx.user){
                const { email } = input

                // Verificar si ya exist el cliente
                const client = await Client.findOne({ email })

                if(client) throw new Error("Ese cliente ya esta registrado")

                const newClient = new Client(input)

                // Asignar el vendedor 
                newClient.seller = ctx.user.id

                // Guardar en la base de datos
                try {

                    const result = await newClient.save()
                    return result

                } catch (error) {
                    console.log(error);
                }
            }
            else 
                throw new Error("No autorizado")
        },

        updateClient: async (_, { id, input }, ctx) => {

            if(ctx && ctx.user){

                // Verificar si existe o no
                let client = await Client.findById( id )
    
                if(!client) throw new Error("Ese cliente no existe")
    
                // Verificar si el vendedor es quien edita
                if(client.seller.toString() !== ctx.user.id) 
                    throw new Error("No tienes la credenciales")
    
                // Guardar el cliente
                client = await Client.findOneAndUpdate({ _id: id }, input, { new: true })
                return client
            }
            else 
                throw new Error("No autorizado")

        },

        deleteClient: async (_, { id }, ctx) => {

            if(ctx && ctx.user){ 
                // Verificar si existe o no
                let client = await Client.findById( id )

                if(!client) throw new Error("Ese cliente no existe")

                // Verificar si el vendedor es quien edita
                if(client.seller.toString() !== ctx.user.id) 
                    throw new Error("No tienes la credenciales")

                // Eliminar cliente
                await Client.findOneAndDelete({ _id: id })

                return "Cliente eliminado"
            }
            else 
                throw new Error("No autorizado")
            
        },

        // Pedidos
        createOrder: async (_, { input }, ctx) => {

            const { client } = input
            
            // Verificar si el cliente existe
            let exist = await Client.findById( client )

            if(!exist) throw new Error("Ese cliente no existe")

            // Verificar si el cliente es del vendedor
            if(exist.seller.toString() !== ctx.user.id) 
                throw new Error("No tienes la credenciales")

            // Revisar que el stock este disponible
            for await (const article of input.order) {
                const { id, quantity } = article

                const product = await Product.findById(id)

                if(quantity > product.stock) 
                    throw new Error(`El articulo: ${product.name} excede la cantidad disponible`)
                else{
                    // Restar la cantidad a lo disponible
                    product.stock = product.stock - quantity
                    await product.save()
                }
            };

            // Asignarle un vendedor
            const newOrder = new Order(input)
            newOrder.seller = ctx.user.id

            // Guardarlo en la base de datos
            const result = await newOrder.save()

            return result
        },

        updateOrder: async (_, { id, input }, ctx) => {

            const { client } = input

            // Verificar si el pedido existe
            const existOrder = await Order.findById(id)

            if(!existOrder) throw new Error("El pedido no existe")

            // Verificar si el cliente existe
            const existClient = await Client.findById(client)

            if(!existClient) throw new Error("El cliente no existe")

            // Si el cliente y pedido pertenecen al vendedor
            // Verificar si el cliente es del vendedor
            if(existClient.seller.toString() !== ctx.user.id) 
                throw new Error("No tienes la credenciales")

            // Revisar el stock
            if(input.order)
                for await (const article of input.order) {
                    const { id, quantity } = article
    
                    const product = await Product.findById(id)
    
                    if(quantity > product.stock) 
                        throw new Error(`El articulo: ${product.name} excede la cantidad disponible`)
                    else{
                        // Restar la cantidad a lo disponible
                        product.stock = product.stock - quantity
                        await product.save()
                    }
                };

            // Guardar el pedido
            const result = await Order.findOneAndUpdate({_id: id}, input, { new: true })
            return result
        },

        deleteOrder: async (_, { id }, ctx) => {
            // Verificar si existe o no
            let order = await Order.findById( id )

            if(!order) throw new Error("Pedido no encontrado")

            // Verificar si el vendedor es quien edita
            if(order.seller.toString() !== ctx.user.id) 
                throw new Error("No tienes la credenciales")

            // Eliminar cliente
            await Order.findOneAndDelete({ _id: id })

            return "Pedido eliminado"
        },
    }
}

module.exports = resolvers