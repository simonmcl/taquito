export const singleSaplingStateContractJProtocol = `# This contract manages a shielded pool with a 1 to 1 conversion with respect to
# the mutez, updated by a list of Sapling transactions.
# As a convention, all unshield transactions must contain in their bound_data
# field a Micheline encoded public_key_hash which is used as the recipient of
# the unshielded tez.

storage (sapling_state 8);
parameter (list (sapling_transaction 8));
code { # Stack manipulation
       UNPAIR;
       NIL operation;
       SWAP;
       DIP { SWAP};
       AMOUNT ;
       SWAP ;
       DIP {SWAP} ;
       ITER {
       # If the transaction is valid, the resulting stack contains the
       # bound_data and balance of the transaction and the updated
       # state. If the rest of the script goes well, this state
       # will be the new state of the smart contract.
              SAPLING_VERIFY_UPDATE;
              # In the case of an invalid transaction, we stop.
              ASSERT_SOME;
              UNPAIR;
              SWAP;
              UNPAIR;
              # Convert the balance in mutez, keeping the signed balance on top
              # of the stack and the balance in mutez as the second element.
              DUP;
              DIP { ABS; # in case of negative balance i.e. shielding
                    PUSH mutez 1;
                    MUL; };
              # We have three cases now: unshielding, shielding and transfers.
              # If the balance is strictly positive (i.e. unshielding), we send
              # funds to the given address.
              # If we can't unpack an address from the bound_data, we stop.
              IFGT {
                     DIIP {UNPACK key_hash;
                           ASSERT_SOME;
                           IMPLICIT_ACCOUNT };
                     SWAP;
                     # The tokens are transferred to the recipient.
                     DIP { UNIT;
                           TRANSFER_TOKENS;
                           SWAP;
                           DIP {CONS} ;};
                   }
                   # If the balance is negative or 0 (i.e. shielding or transfer),
                   # we verify the amount transferred in the transaction is
                   # exactly the balance returned by verify_update. This enforces
                   # the conversion 1-1 between mutez and shielded token
                   # as the balance in mutez of the contract will always be
                   # the same as the number of tokens in the sapling_state.
                   # No operation is executed.
                   {
                     DIIP {SWAP};
                     DIP {SWAP};
                     SWAP;
                     SUB_MUTEZ; ASSERT_SOME;
                     # For a transfer or shield operation, we don't expect an
                     # implicit account in the bound_data field.
                     # If one is given, we fail as it might be an invalid
                     # operation or an erroneous call.
                     DIIP { SIZE; PUSH nat 0; ASSERT_CMPEQ; };
                     SWAP;
                   };
            };
       DIP {
             PUSH mutez 0;
             ASSERT_CMPEQ;};
       SWAP;
       PAIR}
`
