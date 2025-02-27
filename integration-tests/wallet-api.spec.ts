import { PollingSubscribeProvider } from "@taquito/taquito";
import { CONFIGS } from "./config";

CONFIGS().forEach(({ lib, rpc, setup }) => {
  const Tezos = lib;
  const test = require('jest-retries');

  beforeEach(async (done) => {
    await setup();
    Tezos.setStreamProvider(Tezos.getFactory(PollingSubscribeProvider)({ pollingIntervalMilliseconds: 6000 }));
    done();
  })

  describe(`Test wallet api using: ${rpc}`, () => {
    test('Test simple origination and wait for confirmation using promise',  2, async (done: () => void) => {
      const walletOp = await Tezos.wallet.originate({
        balance: "1",
        code: `parameter string;
        storage string;
        code {CAR;
              PUSH string "Hello ";
              CONCAT;
              NIL operation; PAIR};
        `,
        init: `"test"`
      }).send();

      let conf1 = await walletOp.confirmation();
      let currentConf1 = await walletOp.getCurrentConfirmation();
      expect(currentConf1).toEqual(1)
      expect(conf1).toEqual(expect.objectContaining({
        expectedConfirmation: 1,
        currentConfirmation: 1,
        completed: true
      }))

      conf1 = await walletOp.confirmation();
      currentConf1 = await walletOp.getCurrentConfirmation();
      expect(currentConf1).toEqual(1)
      expect(conf1).toEqual(expect.objectContaining({
        expectedConfirmation: 1,
        currentConfirmation: 1,
        completed: true
      }))

      const conf2 = await walletOp.confirmation(2);
      const currentConf2 = await walletOp.getCurrentConfirmation();
      expect(currentConf2).toEqual(2)
      expect(conf2).toEqual(expect.objectContaining({
        expectedConfirmation: 2,
        currentConfirmation: 2,
        completed: true
      }))

      done()
    })

    test('Test simple origination and wait for confirmation using observable',  2, async (done: () => void) => {
      const walletOp = await Tezos.wallet.originate({
        balance: "1",
        code: `parameter string;
        storage string;
        code {CAR;
              PUSH string "Hello ";
              CONCAT;
              NIL operation; PAIR};
        `,
        init: `"test"`
      }).send();

      const events = await new Promise((resolve, reject) => {
        const evts: any[] = [];
        walletOp.confirmationObservable(3).subscribe((event) => evts.push(event), reject, () => resolve(evts))
      })

      expect(events).toEqual(expect.arrayContaining([
        expect.objectContaining({
          currentConfirmation: 1,
          expectedConfirmation: 3,
          completed: false
        }),
        expect.objectContaining({
          currentConfirmation: 2,
          expectedConfirmation: 3,
          completed: false
        }),
        expect.objectContaining({
          currentConfirmation: 3,
          expectedConfirmation: 3,
          completed: true
        })
      ]))

      done()
    })
  })
})
