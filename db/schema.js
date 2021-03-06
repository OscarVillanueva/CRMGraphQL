const { gql } = require("apollo-server")

// Schema
const typeDefs = gql`

    type User {
        id: ID
        name: String
        lastName: String
        email: String
        type: UserType
        created: String
    }

    enum UserType {
        Admin
        Normal
    }

    type Token {
        token: String
    }

    type Product {
        id: ID
        name: String
        stock: Int
        price: Float
        created: String
    }

    type Client {
        id: ID
        name: String
        lastName: String
        email: String
        company: String
        phone: String
        seller: ID
    }

    type OrderGroup {
        id: ID
        quantity: Int,
        name: String
        price: Float
    }

    type Order {
        id: ID
        order: [OrderGroup]
        total: Float
        client: Client
        seller: ID
        date: String
        status: OrderStatus
    }

    type FullOrder {
        id: ID
        order: [OrderGroup]
        total: Float
        client: Client
        seller: User
        date: String
        status: OrderStatus
    }

    type TopClient {
        total: Float
        client: [Client]
    }

    type TopSeller {
        total: Float
        seller: [User]
    }

    input UserInput {
        name: String!
        lastName: String!
        email: String!
        password: String!
        type: UserType!
    }

    input AuthInput {
        email: String!
        password: String!
    }

    input ProductInput {
        name: String!
        stock: Int!
        price: Float!
    }

    input ClientInput {
        name: String!
        lastName: String!
        company: String!
        email: String!
        phone: String
    }

    input OrderProductInput {
        id: ID
        quantity: Int,
        name: String
        price: Float
    }

    input OrderInput {
        order: [OrderProductInput]
        total: Float
        client: ID
        status: OrderStatus
    }

    enum OrderStatus {
        PENDIENTE
        COMPLETADO
        CANCELADO
    }

    type Query {
        # Usuarios
        getUser: User
        getUsers: [User]

        # Productos
        getProducts: [Product]
        getProduct(id: ID!): Product

        # Clientes
        getClients: [Client]
        getClientSeller: [Client]
        getClient(id: ID!): Client

        # Pedidos
        getOrders: [FullOrder]
        getOrdersSeller: [Order]
        getOrder(id: ID!): Order
        getOrderStatus(status: OrderStatus!): [Order]

        # Busquedas avanzadas
        bestClients: [TopClient]
        bestSeller: [TopSeller]
        searchProduct(text: String!): [Product]
    }

    type Mutation {
        # Usuarios
        createUser(input: UserInput!): User
        authenticateUser(input: AuthInput!): Token
        deleteUser(id: ID!): String

        # Productos
        createProduct(input: ProductInput!): Product
        updateProduct(id: ID!, input: ProductInput!): Product
        deleteProduct(id: ID!): String

        # Clientes
        createClient(input: ClientInput): Client
        updateClient(id: ID!, input: ClientInput!): Client
        deleteClient(id: ID!): String

        # Pedidos
        createOrder(input: OrderInput): Order
        updateOrder(id: ID!, input: OrderInput): Order
        deleteOrder(id: ID!): String
    }

`

module.exports = typeDefs