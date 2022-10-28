import nats, { Message } from "node-nats-streaming";
import { randomBytes } from "crypto";

console.clear(); // Note: Clear the terminal

const stan = nats.connect("ticketing", randomBytes(4).toString("hex"), {
  url: "http://localhost:4222"
}); // Remark: Generated random client ID because NATS accepts only one connection per client ID

stan.on("connect", () => {
  console.log("Listener connected to NATS");

  stan.on("close", () => {
    console.log("NATS connection closed!");
    process.exit();
  });

  const options = stan.subscriptionOptions().setManualAckMode(true);
  const subscription = stan.subscribe(
    "ticket:created", // Note: Channel/Topic name
    "orders-service-queue-group", // Important: Queue group is kind of load-balancing. So that multiple services can be the member of same queue group of a topic/channel, but only one of them will receive the event of the queue group.
    options
  );

  subscription.on("message", (msg: Message) => {
    const data = msg.getData();

    if (typeof data === "string") {
      console.log(`Received event #${msg.getSequence()}, with data: ${data}`);
    }

    msg.ack();
  });
});

process.on("SIGINT", () => stan.close()); // Note: Close the connection when the process is interrupted");
process.on("SIGTERM", () => stan.close()); // Note: Close the connection when the process is terminated");
