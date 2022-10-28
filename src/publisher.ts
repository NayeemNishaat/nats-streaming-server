import nats from "node-nats-streaming";

console.clear();

const stan = nats.connect("ticketing", "abc", { url: "http://localhost:4222" }); // Note: abc -> client ID, ticketing -> cluster ID

stan.on("connect", () => {
  console.log("Publisher connected to NATS");

  const data = JSON.stringify({ id: "123", title: "concert", price: 20 }); // Nats only accepts string or buffer as data

  stan.publish("ticket:created", data, () => {
    // Note: ticket:created -> channel/topic name
    console.log("Event published");
  });
});

// Note: K8S Port Forwarding
// kubectl port-forward nats-depl-bdd95c4c5-wcqbk 4222:4222
// Port on Local Machine : Port on Pod
