import nats, { Message, Stan } from "node-nats-streaming";
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

  // const options = stan
  //   .subscriptionOptions()
  //   .setManualAckMode(true)
  //   .setDeliverAllAvailable() // Note: This will deliver all the events stored inside NATS and will be required when a service is created for the first time
  //   .setDurableName("accounting-service"); // Note: This is the identifier/name of the subscription and will set after getting all the previous events via setDeliverAllAvailable() and it will track the events that have been processed so far. Important: Gotcha! If no queue-group is set then NATS will assume that that disconnected service will not come back online hence, it dumps the durable subscription list also.

  // const subscription = stan.subscribe(
  //   "ticket:created", // Note: Channel/Topic name
  //   "orders-service-queue-group", // Important: Queue group is kind of load-balancing. So that multiple services can be the member of same queue group of a topic/channel, but only one of them will receive the event of the queue group. Remark: This will prevent NATS to dump the durable subscription list.
  //   options
  // );

  // subscription.on("message", (msg: Message) => {
  //   const data = msg.getData();

  //   if (typeof data === "string") {
  //     console.log(`Received event #${msg.getSequence()}, with data: ${data}`);
  //   }

  //   msg.ack();
  // });

  new TicketCreatedListener(stan).listen();
});

process.on("SIGINT", () => stan.close()); // Note: Close the connection when the process is interrupted");
process.on("SIGTERM", () => stan.close()); // Note: Close the connection when the process is terminated");

abstract class Listener {
  // Remark: Guideline to create listener instances
  abstract subject: string; // Note: Must be defined by the subclass/child class
  abstract queueGroupName: string;
  abstract onMessage(data: any, msg: Message): void;
  private client: Stan;
  protected ackWait = 5 * 1000; // Note: Protected -> Subclass can define it if needed

  constructor(client: Stan) {
    this.client = client;
  }

  subscriptionOptions() {
    return this.client
      .subscriptionOptions()
      .setDeliverAllAvailable()
      .setManualAckMode(true)
      .setAckWait(this.ackWait)
      .setDurableName(this.queueGroupName);
  }

  listen() {
    const subscription = this.client.subscribe(
      this.subject,
      this.queueGroupName,
      this.subscriptionOptions()
    );

    subscription.on("message", (msg: Message) => {
      console.log(`Message received: ${this.subject} / ${this.queueGroupName}`);

      const parsedData = this.parseMessage(msg);
      this.onMessage(parsedData, msg);
    });
  }

  parseMessage(msg: Message) {
    const data = msg.getData();

    return typeof data === "string"
      ? JSON.parse(data)
      : JSON.parse(data.toString("utf8"));
  }
}

class TicketCreatedListener extends Listener {
  subject = "ticket:created";
  queueGroupName = "payments-service";

  onMessage(data: any, msg: Message) {
    console.log("Event data!", data);

    msg.ack();
  }
}
