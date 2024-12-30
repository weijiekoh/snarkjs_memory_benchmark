pragma circom 2.0.0;

template Fib(n) {
    signal input a;
    signal input b;

    signal output c[n + 2];

    c[0] <== a;
    c[1] <== b;
    for (var i = 2; i < n + 2; i ++) {
        c[i] <== c[i - 1] * c[i - 2];
    }
}
