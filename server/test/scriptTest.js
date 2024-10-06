console.log("hej")
let payload = {
    name: "colab name",
    password: "my password"
}
const res = await fetch("/api/collaborations/create",
    {
        method: 'POST',
        body: payload
    }
)
console.log(res);