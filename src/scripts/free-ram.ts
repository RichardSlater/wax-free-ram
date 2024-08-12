import { Session, SessionKit, type AnyAction, type TransactResult } from "@wharfkit/session";
import { WebRenderer } from "@wharfkit/web-renderer";
import { WalletPluginAnchor } from "@wharfkit/wallet-plugin-anchor";
import { WalletPluginWombat } from "@wharfkit/wallet-plugin-wombat";
import { WalletPluginCloudWallet } from "@wharfkit/wallet-plugin-cloudwallet";
import { GetAllOffers, type AtomicAssetsOffer } from "./atomic-assets-client";

const webRenderer = new WebRenderer();
const testMode = import.meta.env.DEV;

const sessionKit = new SessionKit({
  appName: "WAX RAM Free",
  chains: [
    {
      id: "1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4",
      url: "https://wax.greymass.com",
    },
  ],
  ui: webRenderer,
  walletPlugins: [
    new WalletPluginAnchor(),
    new WalletPluginWombat(),
    new WalletPluginCloudWallet(),
  ],
});

const connectButtons = document.querySelectorAll("button.connect");

connectButtons.forEach((button) => {
  button.addEventListener("click", onConnectClicked);
});

async function onConnectClicked() {
  const response = await sessionKit.login();
  const session = response.session;

  if (session) {
    connectButtons.forEach((b) => b.classList.add("hidden"));

    let offers: AtomicAssetsOffer[];
    const account = session.actor.toString();

    updateTransientState("loading");

    try {
      let states = testMode ? [ 0, 1, 2, 3 ] : [ 0, 1, 2 ];
      offers = await GetAllOffers(60, account, states, "warsaken");
    } catch (error) {
      updateTransientState("error");
      document.getElementById("errors")!.innerText = getErrorMessage(error);
      return;
    }

    if (offers.length == 0) {
      updateTransientState("nothingTodo");
    } else {
      const offersList = document.getElementById("offers");
      const offersListItems = generateOfferElements(offers);
      document.getElementById("countOffers")!.innerText = offers.length.toString();
      document.getElementById("estRam")!.innerText = (offers.length * 420).toString();

      offersList!.innerHTML = '';
      offersListItems.forEach((o) => offersList?.appendChild(o));

      document
        .querySelectorAll(".freeRamButton").forEach((b) => b.addEventListener("click", async _ => { onFreeRamClicked(offers, session) }));

      updateTransientState("freeRam");
    }
  }
}

async function onFreeRamClicked(_offers: AtomicAssetsOffer[], _session: Session) {
  updateTransientState("broadcast");
  const statusList = document.getElementById('transactions');
  const chunkSize = 60;

  for (let i = 0; i < _offers.length; i += chunkSize) {
    const chunk = _offers.slice(i, i + chunkSize);
    let result: TransactResult;
    try {
      result = await _session.transact({ actions: await createCancelOfferTransaction(chunk, _session) });
    } catch (error) {
      updateTransientState("error");
      document.getElementById("errors")!.innerText = getErrorMessage(error);
      return;
    }

    statusList?.appendChild(getStatusNode(chunk, result));
  }
}

function getStatusNode(chunk: AtomicAssetsOffer[], result: TransactResult): HTMLLIElement {
  const transactionId = result.response?.transaction_id as string;
  const li = document.createElement("li");
  const anchor = document.createElement("a");
  anchor.text = transactionId.slice(0, 8)
  anchor.href = `https://waxblock.io/transaction/${transactionId}`;
  anchor.classList.add("transaction-link");
  li.appendChild(document.createTextNode("✅ "));
  li.appendChild(anchor);
  li.appendChild(document.createTextNode(`: ${chunk.map((o) => o.offerId).join(", ")}`));
  return li;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return String(error)
}

function updateTransientState(state: string) {
  console.log(state);
  document
    .querySelectorAll("div.content")
    .forEach((d) => {
      if (d.classList.contains(`state-${state}`)) {
        d.classList.remove("hidden");
      } else {
        d.classList.add("hidden");
      }
    });
}

function generateOfferElements(offers: AtomicAssetsOffer[]): HTMLLIElement[] {
  return offers.map((o) => {
    const li = document.createElement("li");
    const anchor = document.createElement("a");
    anchor.text = o.offerId;
    anchor.href = `https://wax.atomichub.io/trading/trade-offer/wax-mainnet/${o.offerId}`;
    anchor.classList.add("offer-link");
    li.appendChild(anchor);
    li.appendChild(document.createTextNode(`: ${o.senderName} → ${o.recipientName} (${o.memo})`))
    return li;
  });
}

async function createCancelOfferTransaction(offers: AtomicAssetsOffer[], session: Session): Promise<AnyAction[]> {
  return offers.map((o) => ({
    account: "atomicassets",
    name: "canceloffer",
    authorization: [session.permissionLevel],
    data: { offer_id: o.offerId },
  }));
}