import { Protocols, TezosOperationError } from '@taquito/taquito';
import { CONFIGS } from './config';

// TC-T-001: Testcase to duplicate a ticket using "dup" instruction.

CONFIGS().forEach(({ lib, rpc, setup, protocol }) => {
  const Tezos = lib;
  const mondaynet = protocol === Protocols.ProtoALpha ? test: test.skip;

  describe(`Test contracts using: ${rpc}`, () => {
    beforeEach(async (done) => {
      await setup();
      done();
    });

    mondaynet('Verify type ticket string cannot be used with "dup" here because it is not duplicable', async (done) => {
      try {
        const opTicketsDup = await Tezos.contract.originate({
          code: `{ parameter unit;
        storage unit;
        code
          {
            DROP; # drop storage and input
            PUSH nat 1;
            PUSH string "test";
            TICKET;
            DUP;
            DROP;
            DROP;
            UNIT;
            NIL operation;
            PAIR;
          };
        }`,
          storage: 0,
        });

        await opTicketsDup.confirmation();
      } catch (error: any) {
        expect(error.message).toContain('michelson_v1.unexpected_ticket');
      }
      done();
    });

    mondaynet('Verify type ticket string cannot be used with "dup n" here because it is not duplicable', async (done) => {
      try {
        const opTicketsDup = await Tezos.contract.originate({
          code: `{ parameter unit;
            storage unit;
            code
              {
                DROP; # drop storage and input
                PUSH nat 1;
                PUSH string "test";
                TICKET;
                PUSH nat 10;
                DUP 2;
                DROP;
                DROP;
                DROP;
                UNIT;
                NIL operation;
                PAIR;
              };
        }`,
          storage: 0,
        });

        await opTicketsDup.confirmation();
      } catch (error: any) {
        expect(error.message).toContain('michelson_v1.unexpected_ticket');
      }
      done();
    });

    mondaynet('Verify type list (ticket string) cannot be used here because it is not duplicable', async (done) => {
      try {
        const opTicketsDup = await Tezos.contract.originate({
          code: `{ parameter unit;
            storage unit;
            code
              {
                DROP; # drop storage and input
                PUSH nat 1;
                PUSH string "test";
                TICKET;
                NIL (ticket string);
                SWAP;
                CONS;
                DUP;
                DROP;
                DROP;
                UNIT;
                NIL operation;
                PAIR;
              };        
        }`,
          storage: 0,
        });

        await opTicketsDup.confirmation();
      } catch (error: any) {
        expect(error.message).toContain('michelson_v1.unexpected_ticket');
      }
      done();
    });

    mondaynet('Verify Packing a ticket is not possible', async (done) => {
      try {
        const opTicketsDup = await Tezos.contract.originate({
          code: `{ parameter unit;
            storage unit;
            code
              {
                DROP; # drop storage and input
                PUSH nat 1;
                PUSH string "test";
                TICKET;
                PACK;
                DROP;
                UNIT;
                NIL operation;
                PAIR;
              };       
        }`,
          storage: 0,
        });

        await opTicketsDup.confirmation();
      } catch (error: any) {
        expect(error.message).toContain('michelson_v1.unexpected_ticket');
      }
      done();
    });

    mondaynet('Verify pack a ticket stored within a pair structure is not possible', async (done) => {
      try {
        const opTicketsDup = await Tezos.contract.originate({
          code: `{ parameter unit;
            storage unit;
            code
              {
                DROP; # drop storage and input
                PUSH nat 1;
                PUSH string "test";
                TICKET;
                PACK;
                DROP;
                UNIT;
                NIL operation;
                PAIR;
              };       
        }`,
          storage: 0,
        });

        await opTicketsDup.confirmation();
      } catch (error: any) {
        expect(error.message).toContain('michelson_v1.unexpected_ticket');
      }
      done();
    });

    mondaynet('Verify returning a ticket in an on-chain view is not possible', async (done) => {
      try {
        const opTicketsDup = await Tezos.contract.originate({
          code: `{ parameter unit;
            storage (option (ticket string));
            code
              {
                DROP; # drop storage and input
                PUSH nat 1;
                PUSH string "test";
                TICKET;
                SOME;
                NIL operation;
                PAIR;
              };
            view "storage" unit (option (ticket string)) { CDR; };
            #view "storage" unit nat { DROP; PUSH nat 1; };
        }`,
          init: 'None',
        });

        await opTicketsDup.confirmation();
      } catch (error: any) {
        expect(error.message).toContain('michelson_v1.unexpected_ticket');
      }
      done();
    });

  });
});
// This test was transcribed to Taquito from bash scripts at https://github.com/InferenceAG/TezosSecurityBaselineChecking
