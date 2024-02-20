"use client";
import axios from 'axios';
import { Signer, ethers } from "ethers";
import { Button, Input, useToast, VStack, Text } from "@chakra-ui/react";
import useStore from "@/app/store/store";
import { currentWallet } from "../wallets";
import { useCallback, useState } from "react";
import { Loading } from "./Loading";
// import { InnerworksMetrics } from "@innerworks/iw-auth-sdk";

const { useIsConnected, useAccount, useProvider } = currentWallet;

export function SignMessage() {
    const lastTransactionHashAction = useStore(
        (state) => state.setLastTransactionHash,
    );
    const isConnected = useIsConnected();
    const account = useAccount();
    const web3Provider = useProvider();
    const [isSignatureLoading, setIsSignatureLoading] = useState(false);
    const [message, setMessage] = useState("");
    const isLoading = isSignatureLoading
    const toast = useToast();

    // `handleSignature` can only be triggered when you are connected to wallet.
    const handleSignature = useCallback(async () => {
        if (!web3Provider) return;
        const signer = web3Provider?.getSigner() as unknown as Signer;
        try {
            setIsSignatureLoading(true);
            const hashed_message = ethers.id(message);
            console.log("hashed_message: ", hashed_message);
            const signedMessage = await signer.signMessage(message);
            console.log("signed message:", signedMessage);
            // Call https://register.com API to register user with signed message
            const response = await axios.request(
                {
                    method: 'post',
                    url: process.env.NEXT_PUBLIC_FORM_URL,
                    data: {
                        email: message.toLowerCase(),
                        wallet_address: (account as string).toLowerCase(),
                        signed_message: signedMessage
                    }
                }
            )
            console.log("response: ", response);
            // Check response status
            if (response.status !== 200) {
                throw new Error("Registration failed");
            }
            toast({
                position: "top",
                status: "success",
                description: "Successfully registered.",
            });
        } catch (e: unknown) {
            toast({
                position: "top",
                status: "error",
                description: (e as Error).message ?? "Registration failed",
            });
        } finally {
            setIsSignatureLoading(false);
        }
    }, [web3Provider, toast, message]);

    // return early if not connected to wallet
    if (!isConnected) return null;

    return (
        <VStack gap={3} alignItems="flex-start">
            <Text as="h4" fontSize="xl" color="black">
                To participate in the campaign, enter your email address and sign the message with your wallet.
            </Text>
            <Text as="h4" fontSize="l" color="black">
                Don&apos;t worry, you won&apos;t be sending a  the blockchain.
            </Text>
            <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter email address"
            />
            <Button
                colorScheme="blue"
                size="md"
                isLoading={isSignatureLoading}
                onClick={handleSignature}
            >
                Sign message
            </Button>
            {isLoading && <Loading />}
        </VStack>
    );
}
