pragma circom 2.0.0;

template Multiplier (n) {
    signal input a;
    signal input b;
    signal c[n];

    for (var i = 0; i < n; i ++) {
        c[i] <== a * b;
    }
}
