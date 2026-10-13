#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <signal.h>

volatile sig_atomic_t sigint_received = 0;
volatile sig_atomic_t sigterm_received = 0;
volatile sig_atomic_t sigusr1_received = 0;

void signal_handler(int signal)
{
    if (signal == SIGINT)
    {
        sigint_received = 1;
    }
    else if (signal == SIGTERM)
    {
        sigterm_received = 1;
    }
    else if (signal == SIGUSR1)
    {
        sigusr1_received = 1;
    }
}

int main()
{
    struct sigaction sa;

    sa.sa_handler = signal_handler;
    sigemptyset(&sa.sa_mask);
    sa.sa_flags = 0;

    // Register signal handlers
    sigaction(SIGINT, &sa, NULL);
    sigaction(SIGTERM, &sa, NULL);
    sigaction(SIGUSR1, &sa, NULL);

    printf("=================================\n");
    printf("       SIGNAL HANDLER DEMO       \n");
    printf("=================================\n");

    printf("Process ID: %d\n", getpid());

    printf("\nWaiting for signals...\n");
    printf("Press Ctrl+C for SIGINT\n");
    printf("Use: kill -SIGUSR1 %d\n", getpid());
    printf("Use: kill -SIGTERM %d\n", getpid());

    while (1)
    {
        pause();

        if (sigint_received)
        {
            printf("\nSIGINT received!\n");
            printf("Interrupt handled asynchronously.\n");
            sigint_received = 0;
        }

        if (sigusr1_received)
        {
            printf("\nSIGUSR1 received!\n");
            printf("User-defined signal handled.\n");
            sigusr1_received = 0;
        }

        if (sigterm_received)
        {
            printf("\nSIGTERM received!\n");
            printf("Termination requested.\n");
            break;
        }
    }

    printf("Program terminated safely.\n");

    return 0;
}
