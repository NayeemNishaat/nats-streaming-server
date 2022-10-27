import nats, { Message } from "node-nats-streaming";
import { randomBytes } from "crypto";

console.clear(); // Note: Clear the terminal

const stan = nats.connect("ticketing", randomBytes(4).toString("hex"), {
  url: "http://localhost:4222"
}); // Remark: Generated random client ID because NATS accepts only one connection per client ID

stan.on("connect", () => {
  console.log("Listener connected to NATS");

  const subscription = stan.subscribe("ticket:created");

  subscription.on("message", (msg: Message) => {
    const data = msg.getData();

    if (typeof data === "string") {
      console.log(`Received event #${msg.getSequence()}, with data: ${data}`);
    }
  });
});
