#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <fcntl.h>
#include <sys/stat.h>
#include <errno.h>

#define FIFO_NAME "server_fifo"
#define BUFFER_SIZE 100

int main()
{
    char buffer[BUFFER_SIZE];

    // Create Named Pipe
    if (mkfifo(FIFO_NAME, 0666) == -1 && errno != EEXIST)
    {
        perror("mkfifo");
        exit(EXIT_FAILURE);
    }

    printf("Server started.\n");
    printf("Waiting for client messages...\n");

    while (1)
    {
        int fd = open(FIFO_NAME, O_RDONLY);

        if (fd == -1)
        {
            perror("open");
            exit(EXIT_FAILURE);
        }

        int bytes_read = read(fd, buffer, BUFFER_SIZE - 1);

        if (bytes_read > 0)
        {
            buffer[bytes_read] = '\0';

            printf("Client: %s\n", buffer);

            if (strcmp(buffer, "exit") == 0)
            {
                printf("Server shutting down...\n");
                close(fd);
                unlink(FIFO_NAME);
                break;
            }

            printf("Server response: Message processed successfully.\n");
        }

        close(fd);
    }

    return 0;
}
